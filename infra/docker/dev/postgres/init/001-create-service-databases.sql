CREATE DATABASE mais_inclusao_auth;
CREATE DATABASE mais_inclusao_programs;
CREATE DATABASE mais_inclusao_citizens;
CREATE DATABASE mais_inclusao_applications;

\connect mais_inclusao_auth

CREATE SCHEMA IF NOT EXISTS auth;

\connect mais_inclusao_programs

CREATE SCHEMA IF NOT EXISTS programs;

\connect mais_inclusao_citizens

CREATE SCHEMA IF NOT EXISTS citizens;

\connect mais_inclusao_applications

CREATE SCHEMA IF NOT EXISTS applications;
