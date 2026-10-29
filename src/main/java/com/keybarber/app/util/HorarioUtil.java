package com.keybarber.app.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class HorarioUtil {

    public static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static LocalTime parseLocalTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return LocalTime.of(9, 0);
        String clean = timeStr.trim().toUpperCase();
        try {
            if (clean.contains("AM") || clean.contains("PM")) {
                String[] parts = clean.split("\\s+");
                String[] hm = parts[0].split(":");
                int h = Integer.parseInt(hm[0]);
                int m = Integer.parseInt(hm[1]);
                String period = parts[1];
                if ("PM".equalsIgnoreCase(period) && h < 12) h += 12;
                if ("AM".equalsIgnoreCase(period) && h == 12) h = 0;
                return LocalTime.of(h, m);
            } else {
                String[] hm = clean.split(":");
                return LocalTime.of(Integer.parseInt(hm[0]), Integer.parseInt(hm[1]));
            }
        } catch (Exception e) {
            return LocalTime.of(9, 0);
        }
    }

    public static String formatLocalTime12(LocalTime time) {
        if (time == null) return "09:00 AM";
        int h = time.getHour();
        int m = time.getMinute();
        String period = h >= 12 ? "PM" : "AM";
        int h12 = h % 12;
        if (h12 == 0) h12 = 12;
        return String.format("%02d:%02d %s", h12, m, period);
    }

    public static List<LocalTime> generarFranjasHorarias(LocalTime inicio, LocalTime fin, int intervaloMinutos) {
        List<LocalTime> franjas = new ArrayList<>();
        LocalTime actual = inicio;
        while (!actual.isAfter(fin.minusMinutes(intervaloMinutos))) {
            franjas.add(actual);
            actual = actual.plusMinutes(intervaloMinutos);
        }
        return franjas;
    }

    public static boolean seTraslapan(LocalDateTime inicio1, LocalDateTime fin1, LocalDateTime inicio2, LocalDateTime fin2) {
        return inicio1.isBefore(fin2) && fin1.isAfter(inicio2);
    }

    public static boolean seTraslapanHoras(LocalTime inicio1, LocalTime fin1, LocalTime inicio2, LocalTime fin2) {
        return inicio1.isBefore(fin2) && fin1.isAfter(inicio2);
    }
}
