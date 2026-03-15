-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 15, 2026 at 05:31 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `calbayog_farmers`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id` bigint(20) NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `user_name` varchar(120) NOT NULL,
  `action` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`id`, `user_id`, `user_name`, `action`, `created_at`) VALUES
(1, 'U004', 'Jose Dela Cruz', 'Logged in', '2026-03-08 19:35:20'),
(2, 'U006', 'john llyd', 'Logged in', '2026-03-08 19:36:20'),
(3, 'U001', 'Admin CAO', 'Logged in', '2026-03-08 19:37:14'),
(4, 'U001', 'Admin CAO', 'Added crop: Kangkong', '2026-03-08 19:38:10'),
(5, 'U006', 'john llyd', 'Logged in', '2026-03-08 19:45:27'),
(6, 'U006', 'john llyd', 'Added crop: Kangkong', '2026-03-08 19:45:58'),
(7, 'U006', 'john llyd', 'Added crop: Kangkong', '2026-03-08 19:54:35'),
(8, 'U006', 'john llyd', 'Added crop: Pechay', '2026-03-08 19:55:29'),
(9, 'U001', 'Admin CAO', 'Logged in', '2026-03-08 19:56:16'),
(10, 'U006', 'john llyd', 'Logged in', '2026-03-08 19:56:46'),
(11, 'U006', 'john llyd', 'Deleted entry: Corn (CF-024)', '2026-03-08 19:57:14'),
(12, 'U006', 'john llyd', 'Deleted entry: Rice (CF-001)', '2026-03-08 19:57:16'),
(13, 'U006', 'john llyd', 'Deleted entry: Rice (CF-021)', '2026-03-08 19:57:18'),
(14, 'U006', 'john llyd', 'Deleted entry: Tomato (CF-005)', '2026-03-08 19:57:20'),
(15, 'U001', 'Admin CAO', 'Logged in', '2026-03-08 19:57:31'),
(16, 'U001', 'Admin CAO', 'Logged in', '2026-03-13 17:18:55'),
(17, 'U001', 'Admin CAO', 'Added user: john', '2026-03-13 17:31:11'),
(18, 'U003', 'john', 'Logged in', '2026-03-13 17:31:22'),
(19, 'U003', 'john', 'Added crop: Eggplant', '2026-03-13 17:37:55'),
(20, 'U001', 'Admin CAO', 'Logged in', '2026-03-13 17:44:56'),
(21, 'U001', 'Admin CAO', 'Logged in', '2026-03-13 17:55:02'),
(22, 'U003', 'john', 'Logged in', '2026-03-13 18:20:22'),
(23, 'U004', 'lloyd', 'Logged in', '2026-03-13 18:21:35'),
(24, 'U004', 'lloyd', 'Added crop: Pechay', '2026-03-13 18:22:27'),
(25, 'U001', 'Admin CAO', 'Logged in', '2026-03-13 18:30:22'),
(26, 'U004', 'lloyd', 'Logged in', '2026-03-13 18:36:46'),
(27, 'U001', 'Admin CAO', 'Logged in', '2026-03-13 18:49:26'),
(28, 'U004', 'lloyd', 'Logged in', '2026-03-13 18:55:24'),
(29, 'U005', 'johnsa', 'Logged in', '2026-03-13 19:12:29'),
(30, 'U001', 'Admin CAO', 'Logged in', '2026-03-13 19:13:11'),
(31, 'U005', 'johnsa', 'Logged in', '2026-03-13 19:58:11'),
(32, 'U005', 'johnsa', 'Added crop: Coconut', '2026-03-13 20:00:21'),
(33, 'U001', 'Admin CAO', 'Logged in', '2026-03-13 20:00:35'),
(34, 'U001', 'Admin CAO', 'Deleted user: john llyd', '2026-03-13 20:03:13'),
(35, 'U001', 'Admin CAO', 'Deleted user: john', '2026-03-13 20:03:15'),
(36, 'U001', 'Admin CAO', 'Deleted user: lloyd', '2026-03-13 20:03:17'),
(37, 'U005', 'johnsa', 'Logged in', '2026-03-13 20:03:22'),
(38, 'U005', 'johnsa', 'Added crop: Tomato', '2026-03-13 20:03:47'),
(39, 'U003', 'johny hope', 'Logged in', '2026-03-13 20:24:38'),
(40, 'U003', 'johny hope', 'Added crop: Eggplant', '2026-03-13 20:25:06'),
(41, 'U001', 'Admin CAO', 'Logged in', '2026-03-13 20:25:26'),
(42, 'U003', 'johny hope', 'Logged in', '2026-03-13 20:32:30'),
(43, 'U003', 'johny hope', 'Added crop: Ampalaya', '2026-03-13 20:32:56'),
(44, 'U001', 'Admin CAO', 'Logged in', '2026-03-13 20:34:04'),
(45, 'U003', 'johny hope', 'Logged in', '2026-03-13 20:34:33');

-- --------------------------------------------------------

--
-- Table structure for table `barangays`
--

CREATE TABLE `barangays` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `barangays`
--

INSERT INTO `barangays` (`id`, `name`) VALUES
(73, 'Acedillo'),
(74, 'Alibaba'),
(1, 'Amampacang'),
(75, 'Anislag'),
(2, 'Ba-ay'),
(28, 'Baja'),
(3, 'Bante'),
(4, 'Bantian'),
(76, 'Basud'),
(29, 'Bayo'),
(30, 'Begaho'),
(5, 'Binaliw'),
(77, 'Bontay'),
(78, 'Buenavista'),
(6, 'Bugtong'),
(31, 'Cabacungan'),
(32, 'Cabatuan'),
(33, 'Cabicahan'),
(34, 'Cabugawan'),
(79, 'Cacaransan'),
(35, 'Cag-anahaw'),
(36, 'Cag-anibong'),
(11, 'Cag-olango'),
(80, 'Cagbanayacao'),
(37, 'Cagbayang'),
(38, 'Cagbilwang'),
(81, 'Cagboborac'),
(7, 'Caglanipao Sur'),
(8, 'Cagmanipes Norte'),
(9, 'Cagmanipes Sur'),
(10, 'Cagnipa'),
(82, 'Cahumpan'),
(83, 'Calocnayan'),
(12, 'Cangomaod'),
(84, 'Canhumadac'),
(39, 'Capacuhan'),
(40, 'Catabunan'),
(41, 'Caybago'),
(13, 'Danao I'),
(14, 'Danao II'),
(42, 'Dawo'),
(43, 'De Victoria'),
(44, 'Dinabongan'),
(45, 'Dinagan'),
(85, 'Esperanza'),
(86, 'Gabay'),
(87, 'Gadgaran'),
(88, 'Gasdo'),
(89, 'Geraga-an'),
(90, 'Guimbaoyan Norte'),
(91, 'Guimbaoyan Sur'),
(92, 'Guin-on'),
(93, 'Helino'),
(94, 'Hibabngan'),
(95, 'Hibatang'),
(96, 'Higasaan'),
(97, 'Himalandrog'),
(46, 'Hugon Rosales'),
(98, 'Jacinto'),
(99, 'Jimautan'),
(47, 'Jose A. Roño'),
(100, 'Kalilihan'),
(101, 'Kilikili'),
(102, 'Langoyon'),
(48, 'Lapaan'),
(49, 'Libertad'),
(50, 'Limarayon'),
(51, 'Longsob'),
(103, 'Lonoy'),
(104, 'Looc'),
(52, 'Mabini II'),
(53, 'Macatingog'),
(54, 'Mag-ubay'),
(15, 'Malaga'),
(16, 'Malajog'),
(17, 'Malayog'),
(18, 'Malopalo'),
(19, 'Manguino-o'),
(55, 'Mantaong'),
(56, 'Manuel Barral Sr.'),
(20, 'Marcatubig'),
(57, 'Mawacat'),
(105, 'Maybog'),
(106, 'Maysalong'),
(107, 'Migara'),
(58, 'Nabang'),
(108, 'Naga'),
(109, 'Naguma'),
(110, 'Navarro'),
(111, 'Nijaga'),
(59, 'Obo-ob'),
(112, 'Olera'),
(60, 'Oquendo'),
(113, 'Palanas'),
(114, 'Palanogan'),
(61, 'Panlayahan'),
(115, 'Panonongan'),
(62, 'Panoypoy'),
(116, 'Patong'),
(21, 'Peña'),
(63, 'Pilar'),
(117, 'Pinamorotan'),
(64, 'Quezon'),
(65, 'Rizal II'),
(66, 'Roxas II'),
(22, 'Saljag'),
(23, 'San Joaquin'),
(67, 'San Rufino'),
(118, 'Saputan'),
(68, 'Sigo'),
(119, 'Sinantan'),
(69, 'Sinidman Occidental'),
(70, 'Sinidman Oriental'),
(120, 'Tabawan'),
(71, 'Talahiban'),
(121, 'Tanval'),
(122, 'Tapa-e'),
(72, 'Tarabucan'),
(123, 'Tigbe'),
(24, 'Tinambacan Norte'),
(25, 'Tinambacan Sur'),
(26, 'Tinaplacan'),
(27, 'Tomaliguez'),
(124, 'Victory'),
(125, 'Villahermosa');

-- --------------------------------------------------------

--
-- Table structure for table `crop_entries`
--

CREATE TABLE `crop_entries` (
  `id` varchar(10) NOT NULL,
  `crop_type_id` int(11) NOT NULL,
  `barangay_id` int(11) NOT NULL,
  `farmer_name` varchar(120) NOT NULL,
  `farmer_id` varchar(10) DEFAULT NULL,
  `planted` date NOT NULL,
  `expected_harvest` date NOT NULL,
  `status` enum('growing','harvested') NOT NULL DEFAULT 'growing',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `crop_entries`
--

INSERT INTO `crop_entries` (`id`, `crop_type_id`, `barangay_id`, `farmer_name`, `farmer_id`, `planted`, `expected_harvest`, `status`, `notes`, `created_at`, `updated_at`) VALUES
('CF-030', 8, 19, 'john', NULL, '2026-03-14', '2026-03-31', 'growing', 'sasas', '2026-03-13 17:37:55', '2026-03-13 17:37:55'),
('CF-031', 11, 21, 'johnhu', NULL, '2026-03-13', '2026-03-31', 'growing', 'fdsfdsf', '2026-03-13 18:22:27', '2026-03-13 18:22:27'),
('CF-032', 3, 15, 'hello', NULL, '2026-02-27', '2026-03-15', 'growing', 'dhheol', '2026-03-13 20:00:21', '2026-03-13 20:00:21'),
('CF-033', 9, 15, 'fgh', NULL, '2026-03-04', '2026-03-21', 'growing', 'sadsdsa', '2026-03-13 20:03:47', '2026-03-13 20:03:47'),
('CF-034', 8, 20, 'hoi ikaw', 'U003', '2026-03-22', '2026-03-30', 'growing', 'e4rtretttter', '2026-03-13 20:25:06', '2026-03-13 20:25:06'),
('CF-035', 10, 20, 'sadds', 'U003', '2026-03-29', '2026-03-31', 'growing', 'dasdsdsa', '2026-03-13 20:32:56', '2026-03-13 20:32:56');

-- --------------------------------------------------------

--
-- Table structure for table `crop_types`
--

CREATE TABLE `crop_types` (
  `id` int(11) NOT NULL,
  `name` varchar(80) NOT NULL,
  `emoji` varchar(8) NOT NULL DEFAULT '?'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `crop_types`
--

INSERT INTO `crop_types` (`id`, `name`, `emoji`) VALUES
(1, 'Rice', '🌾'),
(2, 'Corn', '🌽'),
(3, 'Coconut', '🥥'),
(4, 'Sugarcane', '🎋'),
(5, 'Banana', '🍌'),
(6, 'Cassava', '🥔'),
(7, 'Sweet Potato', '🍠'),
(8, 'Eggplant', '🍆'),
(9, 'Tomato', '🍅'),
(10, 'Ampalaya', '🥒'),
(11, 'Pechay', '🥬'),
(12, 'Kangkong', '🌿');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(10) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','farmer','at','encoder') NOT NULL DEFAULT 'farmer',
  `barangay_id` int(11) DEFAULT NULL,
  `avatar` varchar(4) NOT NULL DEFAULT 'U',
  `contact` varchar(30) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `farm_location` varchar(255) DEFAULT NULL,
  `farm_size` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `barangay_id`, `avatar`, `contact`, `created_at`, `farm_location`, `farm_size`) VALUES
('U001', 'Admin CAO', 'admin@calbayog.gov.ph', '$2a$10$GSTYZVb19DUSDfT6BvDTwemgMM7jw9oaOz8rVOh6qrI.wk0Ges9N.', 'admin', NULL, 'A', NULL, '2026-03-08 18:48:11', NULL, NULL),
('U003', 'johny hope', 'johny@gmail.com', '$2b$10$hX/ThVKaTmIS/DgiBBv/WeZAoThZ6LfN1Jq9JXTBGY1po3K9wpEIq', 'farmer', 20, 'J', '09124355', '2026-03-13 20:24:24', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_time` (`created_at`);

--
-- Indexes for table `barangays`
--
ALTER TABLE `barangays`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_barangay_name` (`name`);

--
-- Indexes for table `crop_entries`
--
ALTER TABLE `crop_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_entry_crop_type` (`crop_type_id`),
  ADD KEY `fk_entry_barangay` (`barangay_id`),
  ADD KEY `fk_entry_farmer` (`farmer_id`);

--
-- Indexes for table `crop_types`
--
ALTER TABLE `crop_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_crop_name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_email` (`email`),
  ADD KEY `fk_user_barangay` (`barangay_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `barangays`
--
ALTER TABLE `barangays`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=376;

--
-- AUTO_INCREMENT for table `crop_types`
--
ALTER TABLE `crop_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `crop_entries`
--
ALTER TABLE `crop_entries`
  ADD CONSTRAINT `fk_entry_barangay` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`),
  ADD CONSTRAINT `fk_entry_crop_type` FOREIGN KEY (`crop_type_id`) REFERENCES `crop_types` (`id`),
  ADD CONSTRAINT `fk_entry_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_user_barangay` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
