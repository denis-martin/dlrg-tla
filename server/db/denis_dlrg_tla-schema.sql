-- MySQL dump 10.19  Distrib 10.3.31-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: denis_dlrg_tla
-- ------------------------------------------------------
-- Server version	10.3.31-MariaDB-0+deb10u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `dlrg_tla_courseparticipants`
--

DROP TABLE IF EXISTS `dlrg_tla_courseparticipants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_courseparticipants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sId` int(11) NOT NULL,
  `cId` int(11) NOT NULL,
  `pId` int(11) NOT NULL,
  `instructor` tinyint(1) NOT NULL DEFAULT 0,
  `charge` decimal(8,2) DEFAULT NULL,
  `chargePayedAt` date DEFAULT NULL,
  `familyDiscount` tinyint(1) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 0,
  `passSent` tinyint(1) NOT NULL DEFAULT 0,
  `data_enc` text DEFAULT NULL,
  `changedAt` datetime DEFAULT NULL,
  `changedBy` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_courseparticipants_sId_idx` (`sId`),
  KEY `fk_courseparticipants_cId_idx` (`cId`),
  KEY `fk_courseparticipants_pId_idx` (`pId`),
  CONSTRAINT `fk_courseparticipants_cId` FOREIGN KEY (`cId`) REFERENCES `dlrg_tla_courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_courseparticipants_pId` FOREIGN KEY (`pId`) REFERENCES `dlrg_tla_participants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_courseparticipants_sId` FOREIGN KEY (`sId`) REFERENCES `dlrg_tla_seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1708 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_courses`
--

DROP TABLE IF EXISTS `dlrg_tla_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sId` int(11) NOT NULL,
  `ctId` int(11) NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `begin` date NOT NULL,
  `end` date DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `charge` decimal(8,2) DEFAULT NULL,
  `chargeNonMember` decimal(8,2) DEFAULT NULL,
  `seasonPass` tinyint(1) NOT NULL DEFAULT 0,
  `lane` varchar(20) DEFAULT NULL,
  `changedAt` datetime DEFAULT NULL,
  `changedBy` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_courses_sId_idx` (`sId`),
  CONSTRAINT `fk_courses_sId` FOREIGN KEY (`sId`) REFERENCES `dlrg_tla_seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_coursetypechecklists`
--

DROP TABLE IF EXISTS `dlrg_tla_coursetypechecklists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_coursetypechecklists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ctId` int(11) NOT NULL,
  `item` text DEFAULT NULL,
  `order` int(11) NOT NULL,
  `changedAt` datetime DEFAULT NULL,
  `changedBy` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_coursetypes`
--

DROP TABLE IF EXISTS `dlrg_tla_coursetypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_coursetypes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) CHARACTER SET latin1 DEFAULT NULL,
  `prereq` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_participants`
--

DROP TABLE IF EXISTS `dlrg_tla_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data_enc` text CHARACTER SET latin1 DEFAULT NULL,
  `changedAt` datetime DEFAULT NULL,
  `changedBy` varchar(20) CHARACTER SET latin1 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2126 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_presence`
--

DROP TABLE IF EXISTS `dlrg_tla_presence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_presence` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `pId` int(11) NOT NULL,
  `presence` int(11) NOT NULL,
  `data_enc` text DEFAULT NULL,
  `changedAt` datetime DEFAULT NULL,
  `changedBy` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Presence` (`date`,`pId`),
  KEY `fk_presence_pId_idx` (`pId`),
  CONSTRAINT `fk_presence_pId` FOREIGN KEY (`pId`) REFERENCES `dlrg_tla_participants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5064 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_qualifications`
--

DROP TABLE IF EXISTS `dlrg_tla_qualifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_qualifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pId` int(11) NOT NULL,
  `qtId` int(11) NOT NULL,
  `data_enc` text DEFAULT NULL,
  `changedAt` datetime DEFAULT NULL,
  `changedBy` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_qualifications_pId_idx` (`pId`),
  CONSTRAINT `fk_qualifications_pId` FOREIGN KEY (`pId`) REFERENCES `dlrg_tla_participants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1573 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_qualificationtypes`
--

DROP TABLE IF EXISTS `dlrg_tla_qualificationtypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_qualificationtypes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_registrations`
--

DROP TABLE IF EXISTS `dlrg_tla_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pId` int(11) NOT NULL,
  `ctId` int(11) NOT NULL,
  `data_enc` text DEFAULT NULL,
  `changedAt` datetime DEFAULT NULL,
  `changedBy` varchar(20) CHARACTER SET latin1 DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pId_idx` (`pId`),
  CONSTRAINT `fk_registrations_pId` FOREIGN KEY (`pId`) REFERENCES `dlrg_tla_participants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=546 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_seasons`
--

DROP TABLE IF EXISTS `dlrg_tla_seasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_seasons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `begin` date NOT NULL,
  `begin2` date DEFAULT NULL,
  `end` date NOT NULL,
  `data_enc` text DEFAULT NULL,
  `changedAt` datetime DEFAULT NULL,
  `changedBy` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlrg_tla_users`
--

DROP TABLE IF EXISTS `dlrg_tla_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dlrg_tla_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) CHARACTER SET latin1 NOT NULL,
  `passhash` varchar(1024) DEFAULT NULL,
  `email` varchar(45) CHARACTER SET latin1 DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-10-25 16:08:11
