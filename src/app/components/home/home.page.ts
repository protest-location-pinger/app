import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { MapRectangle, GoogleMap } from '@angular/google-maps';
import { Storage } from '@ionic/storage';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  setting;

  /** Tracks refresh state of component */
  refresh$: BehaviorSubject<{
    latitude?: number;
    longitude?: number;
  }> = new BehaviorSubject({ latitude: null, longitude: null });

  /** Tracks whether to show pin placement UI */
  showSelectionUI = false;

  /** Tracks which pin menu item is currently selected */
  currentMenuKey: string;

  /** All marker position on the map, filtered by non-null lat/lng's. (this filtering should be done in the API) */
  /* These should probably be requested by passing a set of coords and it queries within that geographic area.
  We don't want to pull the entire globes worth of markers for each person. */
  markerPositions: google.maps.LatLngLiteral[] = [];

  /** Zoom level of the map */
  zoom = 15; // https://developers.google.com/maps/documentation/ios-sdk/views?hl=en

  /** Bounds of the `<map-rectangle>`. */
  bounds: google.maps.LatLngBoundsLiteral;

  /** Customizable options passed to the map. */
  options = { draggable: true, editable: true };

  /** The `<google-map>` component */
  @ViewChild(GoogleMap) map: GoogleMap;

  /** The `<map-rectangle>` component that displays on the map */
  @ViewChild(MapRectangle) rectangle: MapRectangle;

  @ViewChild('placesRef') placesRef: GooglePlaceDirective;

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private storage: Storage,
    private changeDetector: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const request = this.http.get('http://localhost:5000/pins/');

    // no-no on the nested subscribes. maybe two observables?
    this.refresh$.subscribe(
      (lastPos: { latitude?: number; longitude?: number }) => {
        request.subscribe((data: IPin[]) => {
          if (data) {
            this.addMarkersToMap(data, lastPos);
          } else {
            // TODO: show message for no pins set, center map either at users location or at setting-defined location.
          }
        });
      }
    );

    this.setting = await this.storage.get('setting:locationPreference');

    // Using `addListenerOnce` because the event would repeatedly kick off,
    // causing the search bar rendering to re-run. This would compound the DOM coordinates
    // and shift the search bar offscreen.
    google.maps.event.addListenerOnce(this.map.googleMap, 'tilesloaded', () => {
      const input = document.getElementById(
        'autocomplete-input'
      ) as HTMLInputElement;

      this.map.googleMap.controls[google.maps.ControlPosition.TOP_CENTER].push(
        input
      );

      const searchBox = new google.maps.places.SearchBox(input);

      /* Uses event listener instead of `onAddressChange` event so user doesn't
        have to double-select their address. */
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        const sizeFactor = 0.001; // TODO: Have `sizeFactor` change based on zoom. Also create a `drawRectangle` function.

        const lat = places[0].geometry.location.lat();
        const lng = places[0].geometry.location.lng();

        this.map.googleMap.setCenter({ lat, lng });

        // If the user has the selection rectangle open while searching an address, make sure to bring it along for the ride.
        if (this.showSelectionUI) {
          this.bounds = {
            north: places[0].geometry.location.lat() + sizeFactor,
            south: places[0].geometry.location.lat() - sizeFactor,
            east: places[0].geometry.location.lng() + sizeFactor,
            west: places[0].geometry.location.lng() - sizeFactor,
          };

          // Without manually detecting changes, `rectangle` will not show after searching until the view is changed.
          this.changeDetector.detectChanges();
        }
      });
    });
  }

  /**
   * Associate Markers to the Map
   * @param pins The incoming pins
   * @param lastPos Last emitted position; Non-null if user has just added a pin.
   * @docs-private
   */
  // TODO: should these parameters instead be Observables that are consumed through a combineLatest or something similar?
  addMarkersToMap(pins: IPin[], lastPos) {
    this.markerPositions = [];

    const position =
      lastPos && lastPos.latitude && lastPos.longitude
        ? new google.maps.LatLng(lastPos.latitude, lastPos.longitude)
        : new google.maps.LatLng(pins[0].position.lat, pins[0].position.lng);

    this.markerPositions = pins.map((pin) => {
      const { lat, lng } = pin.position;

      if (lat && lng) {
        return new google.maps.LatLng(lat, lng).toJSON();
      }
    });

    this.map.googleMap.setCenter(position || this.markerPositions[0]);
  }

  /**
   * Handles the Pin menu selection from a user.
   * If a user has location services on, place pin at their location,
   * otherwise, show a selection rectangle on the map.
   * @param key The menu item selected.
   * @docs-private
   */
  async onMenuSelection(key: string) {
    this.currentMenuKey = key;

    const setting = await this.storage.get('setting:locationPreference');

    if (setting == 'automatic') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position: Position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            this.map.googleMap.setCenter(pos);

            this.onAdd(true);
          },
          (e) => {
            console.log('error', e);
          }
        );
      }
    } else {
      const center = this.map.getCenter();
      const sizeFactor = 0.001; // TODO: Have `sizeFactor` change based on zoom.

      this.bounds = {
        north: center.lat() + sizeFactor,
        south: center.lat() - sizeFactor,
        east: center.lng() + sizeFactor,
        west: center.lng() - sizeFactor,
      };

      this.showSelectionUI = true;
      this.currentMenuKey = key;
    }
  }

  /**
   * Handles the canceling of a Pin selection.
   * @docs-private
   */
  onCancel() {
    this.resetUiState();
  }

  /**
   * Resets all UI-related instance variables to component initialization behavior.
   * @docs-private
   */
  private resetUiState() {
    this.currentMenuKey = null;
    this.showSelectionUI = false;
  }

  /**
   * Handles the POST operation of a Pin after selection.
   * @param usingGeolocation Caller of the function decides if this logic should be Geolocation-centric or not.
   * @docs-private
   */
  // TODO: Is there a better way to decide `usingGeolocation`?
  onAdd(usingGeolocation: boolean) {
    const center = usingGeolocation
      ? this.map.getCenter()
      : this.rectangle.getBounds().getCenter();

    const pin = {
      userId: '394749694', // TODO: implement unique identifers per device (doesn't need to be from device, just unique to the device? idk, lots of security stuff to think about)
      lat: center.lat(),
      lng: center.lng(),
      label: this.currentMenuKey,
    };

    this.http.post('http://localhost:5000/pins/', pin).subscribe((response) => {
      if (response) {
        this.presentToast(
          usingGeolocation
            ? `'${this.titleCase(
                this.currentMenuKey
              )}' pin placed at your location.`
            : `'${this.titleCase(
                this.currentMenuKey
              )}' pin placed at selected location.`
        );
        this.resetUiState();
        this.refresh$.next({
          latitude: pin.lat,
          longitude: pin.lng,
        });
      }
    });
  }

  /**
   * Presents a Toast on the screen with a given message.
   * @param message The message to display on the toast.
   * @private
   */
  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
    });

    toast.present();
  }

  // https://www.freecodecamp.org/news/three-ways-to-title-case-a-sentence-in-javascript-676a9175eb27/
  public titleCase(str): string {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => {
        return word.replace(word[0], word[0].toUpperCase());
      })
      .join(' ');
  }
}

interface IPin {
  trackable: {
    createDate: Date;
    userId: number;
  };
  position: {
    lat: number;
    lng: number;
  };
  _id: string;
  label: string;
  showOnMap: boolean;
  imageUrl: string;
}
