package com.example.E_commerce.model;

import java.util.ArrayList;
import java.util.List;

public class Carrinho {
    protected List<Produto> produtos = new ArrayList<>();
    protected Cliente cliente;

    public List<Produto> getProdutos() {
        return produtos;
    }

    public void setProdutos(List<Produto> produtos) {
        this.produtos = produtos;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Carrinho() {}

}
