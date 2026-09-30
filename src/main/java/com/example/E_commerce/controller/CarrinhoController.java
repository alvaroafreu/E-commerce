package com.example.E_commerce.controller;

import com.example.E_commerce.model.Carrinho;
import com.example.E_commerce.model.Cliente;
import com.example.E_commerce.model.Produto;
import com.example.E_commerce.service.CarrinhoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carrinho")
@CrossOrigin(origins = "*")

public class CarrinhoController {
    @Autowired
    private CarrinhoService carrinhoService;

    @PostMapping("/adicionar/{clienteId}/{produtoId}")
    public ResponseEntity adicionarProduto(@PathVariable Long clienteId, @PathVariable Long produtoId, @RequestParam(defaultValue = "1") int quantidade) { //sem o parâmetro quantidade adiciona 1
        carrinhoService.adicionarProdutoPorId(clienteId, produtoId, quantidade);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/produtos/{clienteId}")
    public ResponseEntity<List<Produto>> listaCarrinho(@PathVariable Long clienteId) {
        return ResponseEntity.ok(carrinhoService.mostrarProdutosDoCarrinho(clienteId));
    }
    @DeleteMapping("/{clienteId}/{produtoId}")
    public ResponseEntity<Void> removerProduto(@PathVariable Long clienteId, @PathVariable Long produtoId) {
        carrinhoService.removerProduto(clienteId, produtoId);
        return ResponseEntity.noContent().build();
    }

}
