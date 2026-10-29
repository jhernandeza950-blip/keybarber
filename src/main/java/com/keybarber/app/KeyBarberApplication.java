package com.keybarber.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class KeyBarberApplication {

    public static void main(String[] args) {
        SpringApplication.run(KeyBarberApplication.class, args);
    }
}

