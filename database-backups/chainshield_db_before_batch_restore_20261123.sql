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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_batches`
--

LOCK TABLES `audit_batches` WRITE;
/*!40000 ALTER TABLE `audit_batches` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (14,1,30,'lab.target.registered','pentest_target','22','{\"target_id\":22,\"name\":\"test1\",\"target_url\":\"http:\\/\\/127.0.0.1:8001\",\"target_type\":\"web_application\",\"owner_user_id\":30,\"authorization_status\":\"pending\"}','b6288dc232ddcace267603809bc194cff08b159d81388e2fec0ffa54568b709a','0000000000000000000000000000000000000000000000000000000000000000','8640ce7cc2a2b4f962e72acc167ee2e3beba90d45a803c5ded68ac3605147eda','2026-11-23 01:41:47'),(15,2,28,'lab.target.approved','pentest_target','22','{\"target_id\":22,\"name\":\"test1\",\"target_url\":\"http:\\/\\/127.0.0.1:8001\",\"target_type\":\"web_application\",\"owner_user_id\":30,\"authorization_status\":\"approved\",\"reviewed_by\":28}','cb024c7a684e2b56d69b22c55f9add755aaa3e55b53d89b7fe832f08076a9e53','8640ce7cc2a2b4f962e72acc167ee2e3beba90d45a803c5ded68ac3605147eda','38881bd3a4fcde77fd2ba12875d6ee7220ead42e1bdbc5ca5b4be851ce8510f2','2026-11-23 01:46:58'),(16,3,30,'lab.session.created','lab_session','21','{\"session_id\":21,\"target_id\":22,\"session_name\":\"test1\",\"status\":\"pending\",\"owner_user_id\":30}','71bacb572a25f0ee80f7bdf8e12c0e8b3b7f6bfb3f73f4698c52d925fb0c149d','38881bd3a4fcde77fd2ba12875d6ee7220ead42e1bdbc5ca5b4be851ce8510f2','94a8508c89637e82b94c170a5085c1aa449021770061c70a464167e913c3f899','2026-11-23 01:48:09'),(17,4,30,'lab.session.started','lab_session','21','{\"session_id\":21,\"target_id\":22,\"session_name\":\"test1\",\"previous_status\":\"pending\",\"new_status\":\"running\",\"actor_user_id\":30}','c7bc10425cf99c9a51abbe2d961255108aa7ddec099013edb8c53e7a51621482','94a8508c89637e82b94c170a5085c1aa449021770061c70a464167e913c3f899','ad8c544082c0b95c4994dd723fbe8c1bfc8d71fa9c82f53bfac1f69bcb76e767','2026-11-23 01:48:15'),(18,5,30,'lab.session.scan_executed','lab_session','21','{\"session_id\":21,\"target_id\":22,\"scanner_type\":\"sqli\",\"total_findings\":0,\"finding_ids\":[],\"severity_counts\":{\"critical\":0,\"high\":0,\"medium\":0,\"low\":0,\"info\":0},\"scanner_errors_count\":0,\"started_at\":\"2026-11-23T08:48:26.975948Z\",\"completed_at\":\"2026-11-23T08:48:27.056052Z\"}','9317c4fd36252c094696579ff21d3ce37b78b37cccd11f6a4be664ec316d2e4d','ad8c544082c0b95c4994dd723fbe8c1bfc8d71fa9c82f53bfac1f69bcb76e767','dc0bfcd85252a1798856d4bf5fa4f9c35dc8d6f5f74e1da7284a1c8ef3b4af39','2026-11-23 01:48:27'),(19,6,30,'lab.session.scan_executed','lab_session','21','{\"session_id\":21,\"target_id\":22,\"scanner_type\":\"sqli\",\"total_findings\":0,\"finding_ids\":[],\"severity_counts\":{\"critical\":0,\"high\":0,\"medium\":0,\"low\":0,\"info\":0},\"scanner_errors_count\":0,\"started_at\":\"2026-11-23T08:59:34.115702Z\",\"completed_at\":\"2026-11-23T08:59:34.145267Z\"}','83807029a078d5c5d04e342f0f515286534c54581261f3b39c75f70383c137fd','dc0bfcd85252a1798856d4bf5fa4f9c35dc8d6f5f74e1da7284a1c8ef3b4af39','09e99c6c1b4cdd767e2d816fdfb05072d4e9cea4d069240cf2d21b920b66496a','2026-11-23 01:59:34'),(20,7,30,'lab.session.scan_executed','lab_session','21','{\"session_id\":21,\"target_id\":22,\"scanner_type\":\"xss\",\"total_findings\":0,\"finding_ids\":[],\"severity_counts\":{\"critical\":0,\"high\":0,\"medium\":0,\"low\":0,\"info\":0},\"scanner_errors_count\":0,\"started_at\":\"2026-11-23T08:59:44.380719Z\",\"completed_at\":\"2026-11-23T08:59:44.434422Z\"}','679ee93795a7291b1d53ce33f219e9676593b0f5b259e39d8ba0ec977be4e28d','09e99c6c1b4cdd767e2d816fdfb05072d4e9cea4d069240cf2d21b920b66496a','0e9f531c7bb8c4b282fd787577bbb2bd260892f2103bd2e8bcc1af56a1af144e','2026-11-23 01:59:44'),(21,8,30,'lab.session.scan_executed','lab_session','21','{\"session_id\":21,\"target_id\":22,\"scanner_type\":\"brute_force\",\"total_findings\":1,\"finding_ids\":[9],\"severity_counts\":{\"critical\":0,\"high\":0,\"medium\":0,\"low\":0,\"info\":1},\"scanner_errors_count\":0,\"started_at\":\"2026-11-23T08:59:51.495469Z\",\"completed_at\":\"2026-11-23T08:59:51.504469Z\"}','8a1509b5f162801d2758ad797abbc8e6327db9988f94f3939f360279fa7da2dc','0e9f531c7bb8c4b282fd787577bbb2bd260892f2103bd2e8bcc1af56a1af144e','ddbd437e79a0790678cedb53a7e7f4c32648fedc21fce43dad9ddc6f0081f2ef','2026-11-23 01:59:51'),(22,9,30,'lab.finding.updated','security_finding','9','{\"finding_id\":9,\"session_id\":21,\"previous_values\":{\"remediation_notes\":null,\"remediation_evidence\":null},\"updated_fields\":[\"remediation_notes\",\"remediation_evidence\"]}','8cabae357f2a15bd1cd18a9d065245da31b428de974dc9c8d3f592efd7c9169b','ddbd437e79a0790678cedb53a7e7f4c32648fedc21fce43dad9ddc6f0081f2ef','6c44111a65ac2fec50d8f4f96d8bdc202f4f5dab78208a326ebb60ab25865269','2026-11-23 02:01:20'),(23,10,30,'lab.session.completed','lab_session','21','{\"session_id\":21,\"target_id\":22,\"session_name\":\"test1\",\"previous_status\":\"running\",\"new_status\":\"completed\",\"actor_user_id\":30}','9c5e6de98c7768ea540ce0515c25803911cb3006f0dad52f69db4e42bee80960','6c44111a65ac2fec50d8f4f96d8bdc202f4f5dab78208a326ebb60ab25865269','fcdc0301255d67a2b772d18faa9f5e27dd073f5f99c3f1b30e8fe839a8c369c3','2026-11-23 02:01:48');
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
  `status` enum('pending','confirmed','failed','orphaned') NOT NULL DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blockchain_transactions_transaction_hash_unique` (`transaction_hash`),
  KEY `blockchain_transactions_audit_batch_id_status_index` (`audit_batch_id`,`status`),
  CONSTRAINT `blockchain_transactions_audit_batch_id_foreign` FOREIGN KEY (`audit_batch_id`) REFERENCES `audit_batches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blockchain_transactions`
--

LOCK TABLES `blockchain_transactions` WRITE;
/*!40000 ALTER TABLE `blockchain_transactions` DISABLE KEYS */;
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
-- Table structure for table `lab_sessions`
--

DROP TABLE IF EXISTS `lab_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lab_sessions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pentest_target_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(150) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `configuration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuration`)),
  `summary` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lab_sessions_pentest_target_id_status_index` (`pentest_target_id`,`status`),
  KEY `lab_sessions_user_id_created_at_index` (`user_id`,`created_at`),
  CONSTRAINT `lab_sessions_pentest_target_id_foreign` FOREIGN KEY (`pentest_target_id`) REFERENCES `pentest_targets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lab_sessions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lab_sessions`
--

LOCK TABLES `lab_sessions` WRITE;
/*!40000 ALTER TABLE `lab_sessions` DISABLE KEYS */;
INSERT INTO `lab_sessions` VALUES (21,22,30,'test1','completed','2026-11-23 01:48:15','2026-11-23 02:01:48',NULL,'Assessment keamanan pasif telah diselesaikan pada target http://127.0.0.1:8001 menggunakan scanner Brute Force / Rate Limit. Pemeriksaan menemukan bahwa respons endpoint belum menunjukkan indikator perlindungan rate limiting melalui HTTP status maupun response headers yang diperiksa. Satu security finding (#9) berhasil dicatat dengan severity Info. Rekomendasi perbaikan telah disusun, mencakup penerapan rate limiting, progressive delay, monitoring percobaan login gagal, dan perlindungan akun. Pengujian ulang diperlukan untuk memverifikasi efektivitas mitigasi.','2026-11-23 01:48:09','2026-11-23 02:01:48');
/*!40000 ALTER TABLE `lab_sessions` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_11_09_110157_create_personal_access_tokens_table',1),(5,'2026_11_09_111225_create_roles_table',1),(6,'2026_11_09_111231_create_permissions_table',1),(7,'2026_11_09_111237_create_role_user_table',1),(8,'2026_11_09_111244_create_role_permission_table',1),(9,'2026_11_09_113405_create_security_events_table',1),(10,'2026_11_09_121723_create_security_alerts_table',1),(11,'2026_11_09_130614_create_audit_logs_table',1),(12,'2026_11_09_133221_create_audit_batches_table',1),(13,'2026_11_09_142933_create_blockchain_transactions_table',1),(14,'2026_11_10_065006_add_orphaned_status_to_blockchain_transactions_table',1),(15,'2026_11_11_111551_create_pentest_targets_table',1),(16,'2026_11_11_111858_create_lab_sessions_table',1),(17,'2026_11_11_112034_create_security_findings_table',1),(18,'2026_11_23_033014_add_remediation_fields_to_security_findings_table',1);
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
-- Table structure for table `pentest_targets`
--

DROP TABLE IF EXISTS `pentest_targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pentest_targets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(150) NOT NULL,
  `target_url` varchar(2048) NOT NULL,
  `target_type` varchar(50) NOT NULL DEFAULT 'web_application',
  `description` text DEFAULT NULL,
  `authorization_proof` text DEFAULT NULL,
  `authorization_status` varchar(20) NOT NULL DEFAULT 'pending',
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `authorized_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pentest_targets_approved_by_foreign` (`approved_by`),
  KEY `pentest_targets_authorization_status_index` (`authorization_status`),
  KEY `pentest_targets_user_id_authorization_status_index` (`user_id`,`authorization_status`),
  CONSTRAINT `pentest_targets_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pentest_targets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pentest_targets`
--

LOCK TABLES `pentest_targets` WRITE;
/*!40000 ALTER TABLE `pentest_targets` DISABLE KEYS */;
INSERT INTO `pentest_targets` VALUES (22,30,'test1','http://127.0.0.1:8001','web_application','test1','pemilik','approved',28,'2026-11-23 01:46:58','2026-11-23 01:41:47','2026-11-23 01:46:58');
/*!40000 ALTER TABLE `pentest_targets` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (27,'View Dashboard','dashboard.view',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(28,'View Security Events','security-events.view',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(29,'Manage Security Alerts','security-alerts.manage',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(30,'View Lab','lab.view',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(31,'Manage Lab Sessions','lab.sessions.manage',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(32,'Execute Lab Scenarios','lab.execute',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(33,'View Audit Logs','audit-logs.view',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(34,'Verify Audit Integrity','audit.verify',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(35,'View Blockchain Records','blockchain.view',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(36,'View Reports','reports.view',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(37,'Manage Users','users.manage',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(38,'Manage Roles','roles.manage',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(39,'Manage Permissions','permissions.manage',NULL,'2026-11-23 08:39:42','2026-11-23 08:39:42'),(40,'blockchain.anchor','blockchain-anchor','Mengirim audit batch ke blockchain.','2026-11-23 08:39:42','2026-11-23 08:39:42'),(42,'Approve Pentest Targets','lab.targets.approve','Approve or reject penetration testing targets','2026-11-23 08:46:06','2026-11-23 08:46:06');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (7,'App\\Models\\User',28,'chainshield-api','61339f5094b1408837411bcf3c4d94406a6705bc2827e51d751e2fda6ce5c665','[\"*\"]','2026-11-23 02:02:53',NULL,'2026-11-23 02:02:08','2026-11-23 02:02:53');
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
INSERT INTO `role_permission` VALUES (21,27),(21,28),(21,29),(21,30),(21,31),(21,32),(21,33),(21,34),(21,35),(21,36),(21,37),(21,38),(21,39),(21,40),(21,42),(22,27),(23,27),(23,30),(23,31),(23,32),(23,36);
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
INSERT INTO `role_user` VALUES (21,28),(22,29),(22,31),(23,30);
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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (21,'Super Admin','super-admin','Full system administration access','2026-11-23 08:37:30','2026-11-23 08:37:30'),(22,'User','user','Standard user access','2026-11-23 08:37:30','2026-11-23 08:37:30'),(23,'Penetration Tester','penetration-tester','Authorized security testing access','2026-11-23 08:37:30','2026-11-23 08:37:30');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_alerts`
--

LOCK TABLES `security_alerts` WRITE;
/*!40000 ALTER TABLE `security_alerts` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_events`
--

LOCK TABLES `security_events` WRITE;
/*!40000 ALTER TABLE `security_events` DISABLE KEYS */;
INSERT INTO `security_events` VALUES (1,NULL,'auth.login_failed','medium','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','Login attempt failed.','[]','2026-11-23 00:37:48','2026-11-23 00:37:48','2026-11-23 00:37:48'),(2,NULL,'auth.login_failed','medium','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','Login attempt failed.','[]','2026-11-23 00:37:52','2026-11-23 00:37:52','2026-11-23 00:37:52'),(3,NULL,'auth.login_failed','medium','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','Login attempt failed.','[]','2026-11-23 01:00:09','2026-11-23 01:00:09','2026-11-23 01:00:09'),(4,NULL,'auth.login_failed','medium','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36','Login attempt failed.','[]','2026-11-23 01:01:45','2026-11-23 01:01:45','2026-11-23 01:01:45'),(5,NULL,'auth.login_failed','medium','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','Login attempt failed.','[]','2026-11-23 01:31:43','2026-11-23 01:31:43','2026-11-23 01:31:43'),(6,NULL,'auth.login_failed','medium','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','Login attempt failed.','[]','2026-11-23 01:31:46','2026-11-23 01:31:46','2026-11-23 01:31:46'),(7,28,'auth.login','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged in successfully.','[]','2026-11-23 01:37:56','2026-11-23 01:37:56','2026-11-23 01:37:56'),(8,28,'auth.logout','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged out successfully.','[]','2026-11-23 01:40:42','2026-11-23 01:40:42','2026-11-23 01:40:42'),(9,30,'auth.login','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged in successfully.','[]','2026-11-23 01:41:04','2026-11-23 01:41:04','2026-11-23 01:41:04'),(10,30,'auth.logout','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged out successfully.','[]','2026-11-23 01:41:51','2026-11-23 01:41:51','2026-11-23 01:41:51'),(11,28,'auth.login','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged in successfully.','[]','2026-11-23 01:41:54','2026-11-23 01:41:54','2026-11-23 01:41:54'),(12,28,'auth.logout','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged out successfully.','[]','2026-11-23 01:47:18','2026-11-23 01:47:18','2026-11-23 01:47:18'),(13,30,'auth.login','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged in successfully.','[]','2026-11-23 01:47:35','2026-11-23 01:47:35','2026-11-23 01:47:35'),(14,30,'auth.logout','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged out successfully.','[]','2026-11-23 01:55:37','2026-11-23 01:55:37','2026-11-23 01:55:37'),(15,28,'auth.login','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged in successfully.','[]','2026-11-23 01:55:41','2026-11-23 01:55:41','2026-11-23 01:55:41'),(16,28,'auth.logout','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged out successfully.','[]','2026-11-23 01:58:58','2026-11-23 01:58:58','2026-11-23 01:58:58'),(17,30,'auth.login','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged in successfully.','[]','2026-11-23 01:59:16','2026-11-23 01:59:16','2026-11-23 01:59:16'),(18,30,'auth.logout','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged out successfully.','[]','2026-11-23 02:02:05','2026-11-23 02:02:05','2026-11-23 02:02:05'),(19,28,'auth.login','info','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','User logged in successfully.','[]','2026-11-23 02:02:08','2026-11-23 02:02:08','2026-11-23 02:02:08');
/*!40000 ALTER TABLE `security_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_findings`
--

DROP TABLE IF EXISTS `security_findings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_findings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `lab_session_id` bigint(20) unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `vulnerability_type` varchar(100) NOT NULL,
  `severity` varchar(20) NOT NULL DEFAULT 'medium',
  `description` text NOT NULL,
  `affected_endpoint` varchar(2048) DEFAULT NULL,
  `evidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence`)),
  `recommendation` text DEFAULT NULL,
  `cvss_score` decimal(3,1) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `remediation_notes` text DEFAULT NULL,
  `remediation_evidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`remediation_evidence`)),
  PRIMARY KEY (`id`),
  KEY `security_findings_lab_session_id_severity_index` (`lab_session_id`,`severity`),
  KEY `security_findings_vulnerability_type_severity_index` (`vulnerability_type`,`severity`),
  KEY `security_findings_status_index` (`status`),
  CONSTRAINT `security_findings_lab_session_id_foreign` FOREIGN KEY (`lab_session_id`) REFERENCES `lab_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_findings`
--

LOCK TABLES `security_findings` WRITE;
/*!40000 ALTER TABLE `security_findings` DISABLE KEYS */;
INSERT INTO `security_findings` VALUES (9,21,'Rate Limit Protection Not Observed','Brute Force','info','Respons endpoint tidak menunjukkan indikator rate limiting melalui status HTTP maupun header yang diperiksa. Pemeriksaan ini bersifat pasif dan belum membuktikan bahwa perlindungan brute force tidak tersedia.','http://127.0.0.1:8001','{\"detection_method\":\"passive_rate_limit_header_check\",\"http_status\":200,\"retry_after_present\":false,\"rate_limit_headers_present\":false,\"credential_attempts\":0}','Pastikan endpoint autentikasi memiliki rate limiting, progressive delay, monitoring percobaan gagal, dan perlindungan account lockout yang aman.',NULL,'open','2026-11-23 01:59:51','2026-11-23 02:01:20','Dilakukan pemeriksaan terhadap mekanisme rate limiting pada endpoint aplikasi. Hasil assessment awal menunjukkan bahwa respons endpoint belum menampilkan indikator rate limiting melalui HTTP status maupun response headers yang diperiksa.\n\nTindak lanjut yang direncanakan meliputi penerapan rate limiting pada endpoint autentikasi, pembatasan percobaan login berulang, progressive delay, pencatatan percobaan autentikasi gagal, serta pengujian ulang untuk memastikan mekanisme perlindungan berjalan dengan baik.\n\nStatus perbaikan menunggu implementasi dan verifikasi ulang.','{\"finding_id\":9,\"scanner\":\"brute_force\",\"affected_endpoint\":\"http:\\/\\/127.0.0.1:8001\",\"assessment\":\"Rate limiting indicators not observed\",\"actions_planned\":[\"Implement authentication endpoint rate limiting\",\"Add progressive delay for repeated failed login attempts\",\"Log failed authentication attempts\",\"Configure safe account protection mechanisms\"],\"verification\":{\"status\":\"pending\",\"retest_required\":true}}');
/*!40000 ALTER TABLE `security_findings` ENABLE KEYS */;
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
INSERT INTO `sessions` VALUES ('CNX6D8ggDKNlGU0FCFhRgw7bOcLouaqtRepOZA2k',NULL,'127.0.0.1','Symfony','YTozOntzOjY6Il90b2tlbiI7czo0MDoia0pxaTVuTUJtOWozdHRIMTZzTGNPM1Zjc0J2VEFDQVRmalZLalU2YyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MTY6Imh0dHA6Ly9sb2NhbGhvc3QiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1795419343);
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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (28,'ChainShield Admin','admin@chainshield.local',NULL,'$2y$12$Keje70XvKZPGxKFqdpOyKOxBEY7UPTqq/w7OpQQ6A7viqZ/NlBPCu',NULL,'2026-11-23 08:37:30','2026-11-23 01:37:55'),(29,'Test User','testuser@chainshield.local',NULL,'$2y$10$i/z36h.m4Vs11EGPrlbvU.eIpmYkMTHIdL.azJAQ3kWfzC3X1QDdK',NULL,'2026-11-23 08:37:30','2026-11-23 08:37:30'),(30,'Security Tester','securitytester@chainshield.local',NULL,'$2y$12$LSR9gbz33kgAUPXX9ZDSG./J6lxywp.AuwXpagrov2rEE9vWMdzUK',NULL,'2026-11-23 08:37:30','2026-11-23 01:41:04'),(31,'ChainShield QA','chainshield.qa@example.com',NULL,'$2y$10$47xMjGFvPCxhZOFlwqYQB.QehgQmkESjRasgIWLz2GrIaeRgXKZsa',NULL,'2026-11-23 08:37:30','2026-11-23 08:37:30');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'chainshield_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-23 16:07:08
