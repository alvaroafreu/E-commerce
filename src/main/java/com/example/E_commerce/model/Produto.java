package com.example.E_commerce.model;


import java.util.ArrayList;
import java.util.List;

public class Produto {
    protected String nome;
    protected String descricao;
    protected Double preco;
    protected Integer estoque;
    protected String categoria;
    protected List<String> imagensUrl = new ArrayList<>();
    protected  Long id;

    public Produto() {
    }

    public List<String> getImagensUrl() {
        return imagensUrl;
    }

    public void setImagensUrl(List<String> imagensUrl) {
        this.imagensUrl = imagensUrl;
    }
    public void adicionarImagensUrl(String imagensUrl){
        this.imagensUrl.add(imagensUrl);
    }
    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Double getPreco() {
        return preco;
    }

    public void setPreco(double preco) {
        this.preco = preco;
    }

    public Integer getEstoque() {
        return estoque;
    }

    public void setEstoque(int estoque) {
        this.estoque = estoque;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
