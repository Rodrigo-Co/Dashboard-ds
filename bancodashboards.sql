create database IF NOT EXISTS bancodashboard;
use bancodashboard;
-- drop database bancotb;
create table IF NOT EXISTS usuario(
idusuario int primary key auto_increment not null,
nome varchar(70) not null,
email varchar(70) not null,
senha varchar(70) not null
);
ALTER TABLE usuario MODIFY senha VARCHAR(255) DEFAULT 'GOOGLE_ACCOUNT';

