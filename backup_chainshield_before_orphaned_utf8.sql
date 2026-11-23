-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: chainshield_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

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
-- Table structure for table `audit_batches`
--

DROP TABLE IF EXISTS `audit_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_batches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `batch_number` bigint(20) unsigned NOT NULL,
  `merkle_root` char(64) NOT NULL,
  `total_records` int(10) unsigned NOT NULL,
  `start_sequence` bigint(20) unsigned NOT NULL,
  `end_sequence` bigint(20) unsigned NOT NULL,
  `status` enum('pending','anchored','failed') NOT NULL DEFAULT 'pending',
  `anchored_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `audit_batches_batch_number_unique` (`batch_number`),
  KEY `audit_batches_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_batches`
--

LOCK TABLES `audit_batches` WRITE;
/*!40000 ALTER TABLE `audit_batches` DISABLE KEYS */;
INSERT INTO `audit_batches` VALUES (1,1,'e7de35856fd93efc22eb41883364e61efdf9f71b80cf4ac3313f91e004fd654c',2,1,2,'pending',NULL,'2026-11-09 06:40:10','2026-11-09 06:40:10'),(2,2,'7d2cd3f4148e70d1d36ca4965ca572869be2e8fcfa08916c3f082b6e849bd617',1,3,3,'anchored','2026-11-09 08:10:15','2026-11-09 07:47:12','2026-11-09 08:10:15');
/*!40000 ALTER TABLE `audit_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sequence` bigint(20) unsigned NOT NULL,
  `actor_id` bigint(20) unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `payload_hash` char(64) NOT NULL,
  `previous_hash` char(64) NOT NULL,
  `current_hash` char(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `audit_logs_sequence_unique` (`sequence`),
  UNIQUE KEY `audit_logs_current_hash_unique` (`current_hash`),
  KEY `audit_logs_actor_id_index` (`actor_id`),
  KEY `audit_logs_action_index` (`action`),
  KEY `audit_logs_created_at_index` (`created_at`),
  CONSTRAINT `audit_logs_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,1,'user.login','User','1','{\"description\":\"Super Admin logged in successfully.\",\"ip_address\":\"127.0.0.1\",\"status\":\"success\"}','4d36c1594c16d8067dd63eaef6c47458824a9aa1e3adafb20e876d502ca0ad99','0000000000000000000000000000000000000000000000000000000000000000','7a338a7360aa23830184ac7d0d631d59da1c17a3639f38442ca9e15d9787cacd','2026-11-09 06:11:16'),(2,2,1,'user.logout','User','1','{\"description\":\"Super Admin logged out successfully.\",\"status\":\"success\"}','0665ae2dd081de8f5d07bcfbb0f21696e7dc8178d22d3e1ff66bb5e3afdf5289','7a338a7360aa23830184ac7d0d631d59da1c17a3639f38442ca9e15d9787cacd','42d827b5b0de0a10b9875e8141007e8a3ec99180c9c62a1bd76f03ed4e7f656a','2026-11-09 06:12:06'),(3,3,1,'blockchain.integration_test','blockchain','integration-test','{\"message\":\"Testing Laravel to local blockchain integration\",\"source\":\"manual_test\"}','7d2cd3f4148e70d1d36ca4965ca572869be2e8fcfa08916c3f082b6e849bd617','42d827b5b0de0a10b9875e8141007e8a3ec99180c9c62a1bd76f03ed4e7f656a','ffb4ed9e98508cbe2bb3ef7cdec93cdf84c40f6e3c319aac7f4281f33467a62e','2026-11-09 07:46:53');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blockchain_transactions`
--

DROP TABLE IF EXISTS `blockchain_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blockchain_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `audit_batch_id` bigint(20) unsigned NOT NULL,
  `network` varchar(50) NOT NULL,
  `chain_id` bigint(20) unsigned NOT NULL,
  `contract_address` varchar(42) NOT NULL,
  `transaction_hash` varchar(66) DEFAULT NULL,
  `block_number` bigint(20) unsigned DEFAULT NULL,
  `gas_used` bigint(20) unsigned DEFAULT NULL,
  `status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blockchain_transactions_transaction_hash_unique` (`transaction_hash`),
  KEY `blockchain_transactions_audit_batch_id_status_index` (`audit_batch_id`,`status`),
  CONSTRAINT `blockchain_transactions_audit_batch_id_foreign` FOREIGN KEY (`audit_batch_id`) REFERENCES `audit_batches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blockchain_transactions`
--

LOCK TABLES `blockchain_transactions` WRITE;
/*!40000 ALTER TABLE `blockchain_transactions` DISABLE KEYS */;
INSERT INTO `blockchain_transactions` VALUES (1,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[11920]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 07:48:49','2026-11-09 07:48:50'),(2,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[23064]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 07:49:57','2026-11-09 07:49:58'),(3,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[11556]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 08:02:31','2026-11-09 08:02:31'),(4,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[724]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 08:02:34','2026-11-09 08:02:35'),(5,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[13080]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 08:02:39','2026-11-09 08:02:39'),(6,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[17272]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 08:03:57','2026-11-09 08:03:57'),(7,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[11868]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 08:04:00','2026-11-09 08:04:00'),(8,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[8808]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 08:05:17','2026-11-09 08:05:18'),(9,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[23276]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 08:06:18','2026-11-09 08:06:18'),(10,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[12384]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 08:06:54','2026-11-09 08:06:55'),(11,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3',NULL,NULL,NULL,'failed','#  C:\\Program Files\\nodejs\\node.exe[19952]: std::shared_ptr<InitializationResultImpl> __cdecl node::InitializeOncePerProcessInternal(const std::vector<std::string> &, ProcessInitializationFlags::Flags) at src\\node.cc:1271\r\n  #  Assertion failed: ncrypto::CSPRNG(nullptr, 0)\r\n\r\n----- Native stack trace -----\r\n\r\n 1: 00007FF606516536 node::SetAbortHandler+54\r\n 2: 00007FF6065160E7 node::MultiIsolatePlatform::DisposeIsolate+781383\r\n 3: 00007FF60657879F node::InitializeOncePerProcess+3023\r\n 4: 00007FF606578B6D node::Start+445\r\n 5: 00007FF6066429C2 node::AsyncResource::CallbackScope::CallbackScope+610\r\n 6: 00007FF606852B94 node::AsyncResource::CallbackScope::CallbackScope+2163764\r\n 7: 00007FFD3E26DDA7 BaseThreadInitThunk+23\r\n 8: 00007FFD3FB3EE4C RtlUserThreadStart+44',NULL,'2026-11-09 08:08:55','2026-11-09 08:08:56'),(12,2,'localhost',31337,'0x5FbDB2315678afecb367f032d93F642f64180aa3','0x9dc221c627d44511056696e9132a83c72ab17fe2cf5e3b698134db6f66e0fa75',3,115504,'confirmed',NULL,'2026-11-09 08:10:15','2026-11-09 08:09:31','2026-11-09 08:10:15');
/*!40000 ALTER TABLE `blockchain_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_11_09_110157_create_personal_access_tokens_table',2),(5,'2026_11_09_111225_create_roles_table',3),(6,'2026_11_09_111231_create_permissions_table',3),(7,'2026_11_09_111237_create_role_user_table',3),(8,'2026_11_09_111244_create_role_permission_table',3),(9,'2026_11_09_113405_create_security_events_table',4),(10,'2026_11_09_121723_create_security_alerts_table',5),(11,'2026_11_09_130614_create_audit_logs_table',6),(12,'2026_11_09_133221_create_audit_batches_table',7),(13,'2026_11_09_142933_create_blockchain_transactions_table',8);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'View Dashboard','dashboard.view',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(2,'View Security Events','security-events.view',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(3,'Manage Security Alerts','security-alerts.manage',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(4,'View Lab','lab.view',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(5,'Manage Lab Sessions','lab.sessions.manage',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(6,'Execute Lab Scenarios','lab.execute',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(7,'View Audit Logs','audit-logs.view',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(8,'Verify Audit Integrity','audit.verify',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(9,'View Blockchain Records','blockchain.view',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(10,'View Reports','reports.view',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(11,'Manage Users','users.manage',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(12,'Manage Roles','roles.manage',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(13,'Manage Permissions','permissions.manage',NULL,'2026-11-09 04:18:42','2026-11-09 04:18:42'),(14,'blockchain.anchor','blockchain-anchor','Mengirim audit batch ke blockchain.','2026-11-09 07:40:50','2026-11-09 07:40:50');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (4,'App\\Models\\User',2,'chainshield-api','c011daf9979b0e30e8b47a7ad5ba3ed1742c4c60a2fec1478288f81df3cc8540','[\"*\"]','2026-11-09 04:31:51',NULL,'2026-11-09 04:30:47','2026-11-09 04:31:51'),(8,'App\\Models\\User',3,'chainshield-api','4cb1a382e5e714925a952f98bfd00adab0e36011d5132738842fac6dd88b4c36','[\"*\"]',NULL,NULL,'2026-11-09 04:56:27','2026-11-09 04:56:27'),(10,'App\\Models\\User',1,'chainshield-api','e371408ffa1fe5d375ef25bf160ccad6017f235896e6f43e3dfd497ebd713791','[\"*\"]','2026-11-09 05:15:07',NULL,'2026-11-09 05:14:40','2026-11-09 05:15:07'),(11,'App\\Models\\User',2,'chainshield-api','9c62cc0f6c6f8a67f55fa7bcfe4657141972e1bf5c39fa79280b864e54019fef','[\"*\"]','2026-11-09 05:16:43',NULL,'2026-11-09 05:16:09','2026-11-09 05:16:43'),(12,'App\\Models\\User',1,'chainshield-api','a9be2ef65721eb4e5b17a36a81049910859d0415531cc392452be7475c655876','[\"*\"]','2026-11-09 05:49:31',NULL,'2026-11-09 05:37:07','2026-11-09 05:49:31'),(13,'App\\Models\\User',3,'chainshield-api','0b42eb5ecbe8865d16a1aad986ce042149d10199b87c2a7c0c319ba2d48a7d15','[\"*\"]','2026-11-09 05:52:22',NULL,'2026-11-09 05:51:10','2026-11-09 05:52:22'),(14,'App\\Models\\User',1,'chainshield-api','5feb7a2fe69f9e0e6076f21b9e7e135c985cbd7c6d345eb9d91a34afd8176742','[\"*\"]','2026-11-09 06:23:17',NULL,'2026-11-09 06:21:29','2026-11-09 06:23:17'),(15,'App\\Models\\User',3,'chainshield-api','05e3540db1866cae8661841e0196165a57f91f133178f541ae0cdf32f8879153','[\"*\"]','2026-11-09 06:27:00',NULL,'2026-11-09 06:25:07','2026-11-09 06:27:00'),(16,'App\\Models\\User',2,'chainshield-api','5fbb5a3b94f8898f31b6ca309405456f3102cbfb543c3e149c8accb9fc4e95b1','[\"*\"]','2026-11-09 06:28:26',NULL,'2026-11-09 06:28:01','2026-11-09 06:28:26'),(17,'App\\Models\\User',1,'chainshield-api','fa1775ebfe02984bd295b7505a7be17fd8c39793979a402dd882a6beef34a791','[\"*\"]','2026-11-09 07:48:49',NULL,'2026-11-09 06:47:03','2026-11-09 07:48:49'),(18,'App\\Models\\User',1,'chainshield-api','beb939a330884674d70275257a420229dfb76ccb20dd5a05410c229cf07d6ce6','[\"*\"]','2026-11-09 08:02:39',NULL,'2026-11-09 07:49:24','2026-11-09 08:02:39'),(19,'App\\Models\\User',1,'chainshield-api','03ad83cfde2ffb324a3416480b8e451c29db9b5d01d366cd1270bdbe8c2dcf7d','[\"*\"]','2026-11-09 08:03:59',NULL,'2026-11-09 08:02:50','2026-11-09 08:03:59'),(20,'App\\Models\\User',1,'chainshield-api','2a0e5558ad357d9b97311fc4b125c10dad17e74cbbdefb78824de01daf51e768','[\"*\"]','2026-11-09 08:08:55',NULL,'2026-11-09 08:04:56','2026-11-09 08:08:55'),(21,'App\\Models\\User',1,'chainshield-api','6b3001565c5b4d28207210f7a036fd3afaeabe4b54091fba5ed68784b3c21018','[\"*\"]','2026-11-09 08:16:17',NULL,'2026-11-09 08:09:11','2026-11-09 08:16:17');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permission`
--

DROP TABLE IF EXISTS `role_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permission` (
  `role_id` bigint(20) unsigned NOT NULL,
  `permission_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `role_permission_permission_id_foreign` (`permission_id`),
  CONSTRAINT `role_permission_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permission_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permission`
--

LOCK TABLES `role_permission` WRITE;
/*!40000 ALTER TABLE `role_permission` DISABLE KEYS */;
INSERT INTO `role_permission` VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,13),(1,14),(2,1),(2,2),(2,3),(2,7),(2,10),(3,1),(3,4),(3,5),(3,6),(3,10),(4,1),(4,7),(4,8),(4,9),(4,10),(5,1);
/*!40000 ALTER TABLE `role_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_user`
--

DROP TABLE IF EXISTS `role_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_user` (
  `role_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`user_id`),
  KEY `role_user_user_id_foreign` (`user_id`),
  CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_user`
--

LOCK TABLES `role_user` WRITE;
/*!40000 ALTER TABLE `role_user` DISABLE KEYS */;
INSERT INTO `role_user` VALUES (1,1),(2,3),(5,2);
/*!40000 ALTER TABLE `role_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Admin','super-admin','Memiliki seluruh akses pada sistem ChainShield.','2026-11-09 04:18:42','2026-11-09 04:18:42'),(2,'Security Analyst','security-analyst','Memantau event keamanan dan menangani alert.','2026-11-09 04:18:42','2026-11-09 04:18:42'),(3,'Penetration Tester','penetration-tester','Menjalankan pengujian keamanan pada lab terkontrol.','2026-11-09 04:18:42','2026-11-09 04:18:42'),(4,'Auditor','auditor','Memeriksa audit log dan bukti integritas blockchain.','2026-11-09 04:18:42','2026-11-09 04:18:42'),(5,'User','user','Pengguna biasa dengan akses terbatas.','2026-11-09 04:18:42','2026-11-09 04:18:42');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_alerts`
--

DROP TABLE IF EXISTS `security_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_alerts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `security_event_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` enum('open','investigating','resolved','false_positive') NOT NULL DEFAULT 'open',
  `assigned_to` bigint(20) unsigned DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `security_alerts_security_event_id_foreign` (`security_event_id`),
  KEY `security_alerts_assigned_to_foreign` (`assigned_to`),
  KEY `security_alerts_severity_index` (`severity`),
  KEY `security_alerts_status_index` (`status`),
  KEY `security_alerts_created_at_index` (`created_at`),
  CONSTRAINT `security_alerts_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `security_alerts_security_event_id_foreign` FOREIGN KEY (`security_event_id`) REFERENCES `security_events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_alerts`
--

LOCK TABLES `security_alerts` WRITE;
/*!40000 ALTER TABLE `security_alerts` DISABLE KEYS */;
INSERT INTO `security_alerts` VALUES (1,15,'Possible Brute Force Attack','Detected 5 failed login attempts from IP address 127.0.0.1 within 5 minutes.','high','resolved',3,'2026-11-09 05:52:22','2026-11-09 05:31:42','2026-11-09 05:52:22');
/*!40000 ALTER TABLE `security_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_events`
--

DROP TABLE IF EXISTS `security_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `event_type` varchar(100) NOT NULL,
  `severity` varchar(20) NOT NULL DEFAULT 'info',
  `source_ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `occurred_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `security_events_event_type_index` (`event_type`),
  KEY `security_events_severity_index` (`severity`),
  KEY `security_events_occurred_at_index` (`occurred_at`),
  KEY `security_events_user_id_occurred_at_index` (`user_id`,`occurred_at`),
  CONSTRAINT `security_events_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_events`
--

LOCK TABLES `security_events` WRITE;
/*!40000 ALTER TABLE `security_events` DISABLE KEYS */;
INSERT INTO `security_events` VALUES (1,3,'auth.register','info','127.0.0.1','PostmanRuntime/7.53.0','New user registered successfully.','[]','2026-11-09 04:52:13','2026-11-09 04:52:13','2026-11-09 04:52:13'),(2,3,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 04:52:38','2026-11-09 04:52:38','2026-11-09 04:52:38'),(3,3,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 04:53:09','2026-11-09 04:53:09','2026-11-09 04:53:09'),(4,3,'auth.logout','info','127.0.0.1','PostmanRuntime/7.53.0','User logged out successfully.','[]','2026-11-09 04:54:11','2026-11-09 04:54:11','2026-11-09 04:54:11'),(5,3,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 04:56:27','2026-11-09 04:56:27','2026-11-09 04:56:27'),(6,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 04:56:41','2026-11-09 04:56:41','2026-11-09 04:56:41'),(7,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:08:30','2026-11-09 05:08:30','2026-11-09 05:08:30'),(8,1,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 05:08:50','2026-11-09 05:08:50','2026-11-09 05:08:50'),(9,1,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 05:14:40','2026-11-09 05:14:40','2026-11-09 05:14:40'),(10,2,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 05:16:09','2026-11-09 05:16:09','2026-11-09 05:16:09'),(11,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:31:36','2026-11-09 05:31:36','2026-11-09 05:31:36'),(12,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:31:38','2026-11-09 05:31:38','2026-11-09 05:31:38'),(13,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:31:39','2026-11-09 05:31:39','2026-11-09 05:31:39'),(14,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:31:40','2026-11-09 05:31:40','2026-11-09 05:31:40'),(15,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:31:42','2026-11-09 05:31:42','2026-11-09 05:31:42'),(16,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:31:43','2026-11-09 05:31:43','2026-11-09 05:31:43'),(17,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:31:45','2026-11-09 05:31:45','2026-11-09 05:31:45'),(18,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:31:46','2026-11-09 05:31:46','2026-11-09 05:31:46'),(19,NULL,'auth.login_failed','medium','127.0.0.1','PostmanRuntime/7.53.0','Login attempt failed.','[]','2026-11-09 05:31:48','2026-11-09 05:31:48','2026-11-09 05:31:48'),(20,1,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 05:37:07','2026-11-09 05:37:07','2026-11-09 05:37:07'),(21,3,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 05:51:10','2026-11-09 05:51:10','2026-11-09 05:51:10'),(22,1,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 06:21:29','2026-11-09 06:21:29','2026-11-09 06:21:29'),(23,3,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 06:25:07','2026-11-09 06:25:07','2026-11-09 06:25:07'),(24,2,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 06:28:01','2026-11-09 06:28:01','2026-11-09 06:28:01'),(25,1,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 06:47:03','2026-11-09 06:47:03','2026-11-09 06:47:03'),(26,1,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 07:49:24','2026-11-09 07:49:24','2026-11-09 07:49:24'),(27,1,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 08:02:50','2026-11-09 08:02:50','2026-11-09 08:02:50'),(28,1,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 08:04:56','2026-11-09 08:04:56','2026-11-09 08:04:56'),(29,1,'auth.login','info','127.0.0.1','PostmanRuntime/7.53.0','User logged in successfully.','[]','2026-11-09 08:09:11','2026-11-09 08:09:11','2026-11-09 08:09:11');
/*!40000 ALTER TABLE `security_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('pYTcQ7OZzbGvW0WkZdT9gPSbsBNsa0TM7h94oVql',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiT2FxaHJsOEU1QkFQamE5NGNaNTZGZElmRnFUVjFGUGhGVWc0ZEM1MSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1794223498),('qocAv4AMXHLpoF0LvuHnLHb4GvkMyIfNUGtuexgP',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNURNNkIxTUJFa1F5SW1uZWZKYmYzR0xuU1BvdmkyYndDdzR1TDRwZyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1794234534);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ChainShield Admin','admin@chainshield.local',NULL,'$2y$12$gMM3BKBGQKlQHi078NIlcehfOGvSG4tvsm5BxfBZmuNOG8Zw7enb.',NULL,'2026-11-09 04:09:13','2026-11-09 04:09:13'),(2,'Test User','testuser@chainshield.local',NULL,'$2y$12$88UdSszUPKzY0L7d.7a17eHnppSRagg066tU7YJsJfG4zUyjMdmAy',NULL,'2026-11-09 04:30:47','2026-11-09 04:30:47'),(3,'Security Tester','securitytester@chainshield.local',NULL,'$2y$12$W6mr5Ab6SFCGrT.Y0ZJWne8EnW6rFtB6OyV6otcay6znmVuX47/7m',NULL,'2026-11-09 04:52:13','2026-11-09 04:52:13');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-10 13:49:13
