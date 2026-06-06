-- Sweet Drip — SQL Server schema
-- EF Core creates this automatically on first run (EnsureCreated + seed).
-- Use this script for manual setup or reference.

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'SweetDripDb')
    CREATE DATABASE SweetDripDb;
GO

USE SweetDripDb;
GO

CREATE TABLE Categories (
    Id          NVARCHAR(64)  NOT NULL PRIMARY KEY,
    Name        NVARCHAR(120) NOT NULL,
    Image       NVARCHAR(MAX) NOT NULL,
    Visible     BIT           NOT NULL DEFAULT 1,
    SortOrder   INT           NOT NULL DEFAULT 0
);

CREATE TABLE Products (
    Id              NVARCHAR(64)  NOT NULL PRIMARY KEY,
    CategoryId      NVARCHAR(64)  NOT NULL REFERENCES Categories(Id),
    Name            NVARCHAR(160) NOT NULL,
    Description     NVARCHAR(MAX) NOT NULL,
    Price           DECIMAL(10,2) NOT NULL,
    Image           NVARCHAR(MAX) NOT NULL,
    Notes           NVARCHAR(MAX) NOT NULL DEFAULT '',
    NoteChoicesJson NVARCHAR(MAX) NOT NULL DEFAULT '[]' -- [{ "label": "Large", "extraPrice": 1.5 }]
);

CREATE TABLE Offers (
    Id              NVARCHAR(64)  NOT NULL PRIMARY KEY,
    Title           NVARCHAR(160) NOT NULL,
    Description     NVARCHAR(MAX) NOT NULL,
    Price           DECIMAL(10,2) NOT NULL,
    Image           NVARCHAR(MAX) NOT NULL,
    ProductIdsJson  NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    StartAt         DATETIME2     NULL,
    EndAt           DATETIME2     NULL,
    Active          BIT           NOT NULL DEFAULT 1
);

CREATE TABLE Orders (
    Id                    NVARCHAR(64)  NOT NULL PRIMARY KEY,
    CreatedAt             DATETIME2     NOT NULL,
    CustomerName          NVARCHAR(160) NOT NULL,
    CustomerEmail         NVARCHAR(200) NOT NULL,
    CustomerPhone         NVARCHAR(40)  NOT NULL,
    PickupDate            NVARCHAR(20)  NOT NULL,
    PickupTime            NVARCHAR(20)  NOT NULL,
    Message               NVARCHAR(500) NULL,
    Subtotal              DECIMAL(10,2) NOT NULL,
    Tip                   DECIMAL(10,2) NOT NULL,
    Tax                   DECIMAL(10,2) NOT NULL,
    TaxRate               DECIMAL(5,2)  NOT NULL,
    Total                 DECIMAL(10,2) NOT NULL,
    Status                INT           NOT NULL DEFAULT 0,
    PaymentStatus         INT           NOT NULL DEFAULT 0,
    StripePaymentIntentId NVARCHAR(120) NULL,
    PaymentFailureReason  NVARCHAR(500) NULL
);
CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);
CREATE INDEX IX_Orders_PaymentStatus ON Orders(PaymentStatus);

CREATE TABLE OrderItems (
    Id         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId    NVARCHAR(64)  NOT NULL REFERENCES Orders(Id) ON DELETE CASCADE,
    ProductId  NVARCHAR(64)  NOT NULL,
    Name       NVARCHAR(160) NOT NULL,
    Price      DECIMAL(10,2) NOT NULL,
    Qty        INT           NOT NULL,
    Note       NVARCHAR(500) NULL,
    NoteChoice NVARCHAR(120) NULL,
    Image      NVARCHAR(MAX) NULL
);

CREATE TABLE CateringRequests (
    Id        NVARCHAR(64)  NOT NULL PRIMARY KEY,
    CreatedAt DATETIME2     NOT NULL,
    Name      NVARCHAR(160) NOT NULL,
    Email     NVARCHAR(200) NOT NULL,
    Phone     NVARCHAR(40)  NOT NULL,
    Guests    INT           NOT NULL,
    Date      NVARCHAR(20)  NOT NULL,
    Time      NVARCHAR(20)  NOT NULL,
    Message   NVARCHAR(500) NULL,
    Status    INT           NOT NULL DEFAULT 0
);
CREATE INDEX IX_CateringRequests_CreatedAt ON CateringRequests(CreatedAt);

CREATE TABLE AdminUsers (
    Id           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Username     NVARCHAR(80)  NOT NULL,
    PasswordHash NVARCHAR(200) NOT NULL,
    UpdatedAt    DATETIME2     NOT NULL
);

CREATE TABLE AppSettings (
    [Key]   NVARCHAR(80)  NOT NULL PRIMARY KEY,
    [Value] NVARCHAR(MAX) NOT NULL
);

CREATE TABLE HeroContents (
    Id                   INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Tagline              NVARCHAR(500) NOT NULL,
    Image                NVARCHAR(MAX) NOT NULL,
    FloatingImagesJson   NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    AboutImage           NVARCHAR(MAX) NOT NULL,
    BackgroundSlidesJson NVARCHAR(MAX) NOT NULL DEFAULT '[]',
    HeroBadge            NVARCHAR(200) NOT NULL DEFAULT '',
    HeroTitleBefore      NVARCHAR(200) NOT NULL DEFAULT '',
    HeroTitleAccent      NVARCHAR(200) NOT NULL DEFAULT '',
    HeroTitleAfter       NVARCHAR(200) NOT NULL DEFAULT ''
);

CREATE TABLE SiteImages (
    Id          NVARCHAR(64)   NOT NULL PRIMARY KEY,
    FileName    NVARCHAR(260)  NOT NULL,
    ContentType NVARCHAR(120)  NOT NULL,
    Data        VARBINARY(MAX) NOT NULL,
    CreatedAt   DATETIME2      NOT NULL
);

-- Status enums (reference):
-- Order.Status: 0=AwaitingPayment, 1=New, 2=Preparing, 3=Ready, 4=Done, 5=Cancelled
-- Order.PaymentStatus: 0=Pending, 1=Paid, 2=Failed
-- CateringRequest.Status: 0=New, 1=Contacted, 2=Done
