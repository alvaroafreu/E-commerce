package com.example.E_commerce.controller;

import com.example.E_commerce.model.Produto;
import com.example.E_commerce.service.ProdutoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin(origins = "*")

public class ProdutoController {

    @Autowired
    private ProdutoService produtoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Produto salvarProduto(@RequestBody Produto produto){
        return produtoService.salvar(produto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarProduto(@PathVariable Long id){
        produtoService.deletar(id);
    }
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<Produto> listarProdutos(){
        return produtoService.listar();
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public void atualizarProduto(@PathVariable Long id, @RequestBody Produto produtoAtualizado){
       produtoService.atualizarProduto(id, produtoAtualizado);
    }
}
