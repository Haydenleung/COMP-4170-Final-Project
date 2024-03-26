# COMP-4170 Final Project 

## Description 
A login and subcription page for Seven Sip Coffee Subscrition service

## Team Members 
Giovana Birck, Hayden Leung, Kaitlyn Cameron, and Sara Shiojima

## Run 
npm install express / 
node app.js


## Local Database Needed 

1) Open pgAdmin
2) Create Database called sevensips
3) Update to your pgAdmin password on App.js
4) Create 3 tables 

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE subscription (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    option VARCHAR(255) NOT NULL
);

CREATE TABLE coffee (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    dateperiod VARCHAR(255),
    selection VARCHAR(255)
);



