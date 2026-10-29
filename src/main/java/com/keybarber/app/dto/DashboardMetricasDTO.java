package com.keybarber.app.dto;

import java.math.BigDecimal;
import java.util.Map;

public class DashboardMetricasDTO {

    private long citasHoy;
    private long citasPendientesHoy;
    private long citasCompletadasHoy;
    private BigDecimal ingresosHoy;
    private long citasSemana;
    private BigDecimal ingresosSemana;
    private Map<String, Long> citasPorEstado;
    private Map<String, Long> citasPorBarbero;

    public DashboardMetricasDTO() {}

    public long getCitasHoy() { return citasHoy; }
    public void setCitasHoy(long citasHoy) { this.citasHoy = citasHoy; }

    public long getCitasPendientesHoy() { return citasPendientesHoy; }
    public void setCitasPendientesHoy(long citasPendientesHoy) { this.citasPendientesHoy = citasPendientesHoy; }

    public long getCitasCompletadasHoy() { return citasCompletadasHoy; }
    public void setCitasCompletadasHoy(long citasCompletadasHoy) { this.citasCompletadasHoy = citasCompletadasHoy; }

    public BigDecimal getIngresosHoy() { return ingresosHoy; }
    public void setIngresosHoy(BigDecimal ingresosHoy) { this.ingresosHoy = ingresosHoy; }

    public long getCitasSemana() { return citasSemana; }
    public void setCitasSemana(long citasSemana) { this.citasSemana = citasSemana; }

    public BigDecimal getIngresosSemana() { return ingresosSemana; }
    public void setIngresosSemana(BigDecimal ingresosSemana) { this.ingresosSemana = ingresosSemana; }

    public Map<String, Long> getCitasPorEstado() { return citasPorEstado; }
    public void setCitasPorEstado(Map<String, Long> citasPorEstado) { this.citasPorEstado = citasPorEstado; }

    public Map<String, Long> getCitasPorBarbero() { return citasPorBarbero; }
    public void setCitasPorBarbero(Map<String, Long> citasPorBarbero) { this.citasPorBarbero = citasPorBarbero; }
}

