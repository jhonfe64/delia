-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-08-2020 a las 19:29:55
-- Versión del servidor: 10.4.11-MariaDB
-- Versión de PHP: 7.4.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `delilah_resto`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orders`
--

CREATE TABLE `orders` (
  `id_order` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` varchar(255) DEFAULT 'preparando',
  `hour` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `orders`
--

INSERT INTO `orders` (`id_order`, `user_id`, `status`, `hour`) VALUES
(311, 116, 'preparando', '2020-07-09 01:04:17'),
(312, 116, 'preparando', '2020-07-09 23:37:29'),
(313, 116, 'preparando', '2020-07-09 23:47:05'),
(314, 116, 'preparando', '2020-07-09 23:47:24'),
(315, 116, 'preparando', '2020-07-10 00:35:49'),
(316, 116, 'preparando', '2020-07-10 00:51:12'),
(317, 116, 'preparando', '2020-07-10 00:51:13'),
(318, 116, 'preparando', '2020-07-10 01:01:00'),
(319, 116, 'preparando', '2020-07-10 01:01:03'),
(320, 116, 'preparando', '2020-07-10 01:01:37'),
(321, 116, 'preparando', '2020-07-10 01:01:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `price_per_unit` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `products`
--

INSERT INTO `products` (`product_id`, `product_name`, `price_per_unit`) VALUES
(7, 'papitas fritas', 1000),
(19, 'pollo frito', 25000),
(20, 'arroz', 3200),
(22, 'arepa', 1850),
(23, 'empanada', 2650),
(24, 'helado de fresa', 8000),
(25, 'helado de chocolate', 2500);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products_per_order`
--

CREATE TABLE `products_per_order` (
  `products_id` int(11) NOT NULL,
  `id_order` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `products_per_order`
--

INSERT INTO `products_per_order` (`products_id`, `id_order`, `product_id`, `quantity`) VALUES
(501, 311, 23, 1),
(502, 311, 25, 3),
(503, 312, 23, 1),
(504, 312, 25, 3),
(505, 313, 23, 1),
(506, 313, 25, 3),
(507, 314, 23, 1),
(508, 314, 25, 3),
(509, 315, 23, 1),
(510, 315, 25, 3),
(511, 316, 23, 1),
(512, 316, 25, 3),
(513, 317, 23, 1),
(514, 317, 25, 3),
(515, 321, 23, 1),
(516, 321, 25, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `nickname` varchar(255) NOT NULL,
  `name_last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` int(11) NOT NULL,
  `direction` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`user_id`, `nickname`, `name_last_name`, `email`, `phone_number`, `direction`, `password`, `rol`) VALUES
(115, 'john123', 'john fredy pérez', 'john@john.com', 2147483647, 'calle falsa 123', '$2b$10$XqLIHE63gvz0/5zt0qs.N.A83ODu.hvK5gFJrneb.Z0V7/vnnOyTS', 'superAdmin'),
(116, 'maria123', 'maria osorio', 'maria@maria.com', 2147483647, 'aveniida siempreviva 123', '$2b$10$v7qD2L8xiK9zO2hKYBEbs.4m9esy1UcYeHQRXfKPcw7n9EOuPp/6C', 'user'),
(117, 'andrea123', 'andrea osorio', 'andrea@andrea.com', 2147483647, 'cra 5# 1-34', '$2b$10$Wb4rz9XUxUtVMnqpxdeet.MnC4LCTRIX41AJHJp1aN67ooxDYhVgu', 'user');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id_order`),
  ADD KEY `fk_user_id` (`user_id`);

--
-- Indices de la tabla `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`);

--
-- Indices de la tabla `products_per_order`
--
ALTER TABLE `products_per_order`
  ADD PRIMARY KEY (`products_id`),
  ADD KEY `fk_id_order` (`id_order`),
  ADD KEY `fk_product_id` (`product_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `orders`
--
ALTER TABLE `orders`
  MODIFY `id_order` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=322;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `products_per_order`
--
ALTER TABLE `products_per_order`
  MODIFY `products_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=517;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=118;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Filtros para la tabla `products_per_order`
--
ALTER TABLE `products_per_order`
  ADD CONSTRAINT `fk_id_order` FOREIGN KEY (`id_order`) REFERENCES `orders` (`id_order`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
