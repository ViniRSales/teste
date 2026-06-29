package com.servify.backend.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// @Configuration
// @EnableWebSecurity
// public class SecurityConfig {

// 	@Bean
// 	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
// 		http
// 				.csrf(AbstractHttpConfigurer::disable)
// 				.authorizeHttpRequests(auth -> auth
// 						.requestMatchers(
// 								"/swagger-ui/**",
// 								"/swagger-ui.html",
// 								"/v3/api-docs",
// 								"/v3/api-docs/**")
// 						.permitAll()
// 						.anyRequest()
// 						.authenticated());
// 		return http.build();
// 	}
// }

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	/**
	 * CORS global: o Spring Security só repassa os headers se {@code .cors()} estiver
	 * ativo; sem isso, o navegador bloqueia chamadas do Vite ({@code localhost:5173})
	 * para a API ({@code localhost:8080}).
	 */
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		List<String> patterns = new ArrayList<>(List.of(
				"http://localhost:*",
				"https://localhost:*",
				"http://127.0.0.1:*",
				"https://127.0.0.1:*"));
		// Vite com --host (rede local)
		patterns.add("http://192.168.*:*");
		patterns.add("http://10.*:*");
		config.setAllowedOriginPatterns(patterns);
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
		config.setAllowedHeaders(List.of("*"));
		// "*" não é permitido em exposed headers no Spring; listar o que o front costuma ler
		config.setExposedHeaders(List.of(
				HttpHeaders.AUTHORIZATION,
				HttpHeaders.CONTENT_DISPOSITION,
				HttpHeaders.LOCATION));
		config.setAllowCredentials(true);
		config.setMaxAge(3600L);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(AbstractHttpConfigurer::disable)
				.cors(Customizer.withDefaults())
				.authorizeHttpRequests(auth -> auth
						.anyRequest()
						.permitAll());
		return http.build();
	}
}