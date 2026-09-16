package com.example.E_commerce.model;

public class Admin extends Usuario{
    protected String funcao;

    public Admin(){
        this.tipo = "ADMIN";
    } // para saber se é do tipo ADMIn

    public String getTipo(){
        return "ADMIN";
    }
    public String getFuncao() {
        return funcao;
    }

    public void setFuncao(String funcao) {
        this.funcao = funcao;
    }
}
