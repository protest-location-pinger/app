"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var pinSchema = new mongoose_1.Schema({
    id: mongoose_1.Schema.Types.ObjectId,
    label: String,
    showOnMap: Boolean,
    imageUrl: String,
    trackable: {
        userId: Number,
        createDate: Date
    },
    position: {
        lat: Number,
        lng: Number
    }
});
var Pin = mongoose_1.model('Pin', pinSchema);
exports.default = Pin;
