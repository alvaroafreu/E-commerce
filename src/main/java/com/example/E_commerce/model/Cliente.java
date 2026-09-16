package com.example.E_commerce.model;

import java.util.List;

public class Cliente extends Usuario {
    private String endereco;
    private List<Produto> historicosCompras;
    public Cliente(){
        this.tipo = "CLIENTE";
    }
    public String getTipo() {
        return "CLIENTE";
    }
    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public List<Produto> getHistoricosCompras() {
        return historicosCompras;
    }

    public void setHistoricosCompras(List<Produto> historicosCompras) {
        this.historicosCompras = historicosCompras;
    }
}
