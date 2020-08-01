CREATE TABLE master.PINS
(
    PIN_ID CHAR(38) CHARACTER SET UTF8MB4,
    USER_ID CHAR(38) CHARACTER SET UTF8MB4,
    LATITUDE DECIMAL(6,3),
    LONGITUDE DECIMAL(6,3),
    LABEL NVARCHAR(512),
    CREATE_DATE DATETIME,
    CONSTRAINT PK_PIN PRIMARY KEY (PIN_ID, USER_ID),
    FOREIGN KEY (USER_ID)
        REFERENCES USERS(USER_ID)
);

/*
DROP TABLE PINS; 
*/

