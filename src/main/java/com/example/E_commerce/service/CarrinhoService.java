package com.example.E_commerce.service;


import com.example.E_commerce.model.Carrinho;
import com.example.E_commerce.model.Cliente;
import com.example.E_commerce.model.Produto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CarrinhoService {

    // Usa o MESMO ProdutoService (singleton) onde os produtos são cadastrados
    @Autowired
    private ProdutoService produtoService;

    // Um carrinho para cada cliente
    private final Map<Long, Carrinho> carrinhos = new HashMap<>();

    public void adicionarProdutoPorId(Long clienteId, Long produtoId, int quantidade) {
        if (quantidade < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade inválida");
        }

        Produto produto = null;
        for (Produto p : produtoService.listar()) {
            if (p.getId().equals(produtoId)) {
                produto = p;
                break;
            }
        }
        if (produto == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado");
        }

        List<Produto> itens = carrinhos.computeIfAbsent(clienteId, id -> new Carrinho()).getProdutos();

        // Regra: (o que já está no carrinho + o que quer adicionar) não pode passar do estoque
        long jaNoCarrinho = itens.stream().filter(p -> p.getId().equals(produtoId)).count();
        if (produto.getEstoque() != null && jaNoCarrinho + quantidade > produto.getEstoque()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estoque insuficiente");
        }

        for (int i = 0; i < quantidade; i++) {
            itens.add(produto);
        }
    }



    public List<Produto> mostrarProdutosDoCarrinho(Long clienteId) {
        Carrinho carrinho = carrinhos.get(clienteId);
        if (carrinho == null) {
            return new ArrayList<>();
        }
        return carrinho.getProdutos();
    }
    public void removerProduto(Long clienteId, Long produtoId) {
        Carrinho carrinho = carrinhos.get(clienteId);
        if (carrinho != null) {
            carrinho.getProdutos().removeIf(p -> p.getId().equals(produtoId));
        }
    }
}