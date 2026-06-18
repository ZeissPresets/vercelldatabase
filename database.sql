CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `heap_used` VARCHAR(50) NOT NULL,
  `cpu_load` FLOAT NOT NULL,
  `event_type` VARCHAR(50) DEFAULT 'monitor',
  `details` TEXT,
  PRIMARY KEY (`id`),
  INDEX (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;