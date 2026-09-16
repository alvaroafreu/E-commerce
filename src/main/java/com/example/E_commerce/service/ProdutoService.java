package com.example.E_commerce.service;

import com.example.E_commerce.model.Produto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProdutoService {
    private List<Produto> produtos =  new ArrayList<>();
    private  static Long contadorId = 1l;


    public Produto salvar(Produto produto){
        produto.setId(contadorId++);
        produtos.add(produto);
        return produto;
    }
    public List<Produto> listar(){
        return produtos;
    }
    public void deletar(Long id){
        produtos.removeIf(produto -> produto.getId().equals(id));
    }


    public void atualizarProduto(Long id, Produto produtoAtualizado){
        boolean produtoEncontrado = false;

        for(Produto produto : produtos) {
            if(produto.getId().equals(id)) {
                produtoEncontrado = true;
                if(produtoAtualizado.getNome( )!=null){
                    produto.setNome(produtoAtualizado.getNome());
                }
                if(produtoAtualizado.getDescricao() !=null){
                    produto.setDescricao(produtoAtualizado.getDescricao());
                }
                if(produtoAtualizado.getEstoque() !=null){
                    produto.setEstoque(produtoAtualizado.getEstoque());
                }
                if(produtoAtualizado.getPreco()!=null){
                    produto.setPreco(produtoAtualizado.getPreco());
                }
                if(produtoAtualizado.getCategoria()!=null){
                    produto.setCategoria(produtoAtualizado.getCategoria());
                }
                if(produtoAtualizado.getImagensUrl()!=null){
                    produto.setImagensUrl(produtoAtualizado.getImagensUrl());
                }

                break;
            }

        }
        if(!produtoEncontrado) {
            System.out.println("O produto com o id: " + id + " Não foi encontrado!");
        }
    }
}
