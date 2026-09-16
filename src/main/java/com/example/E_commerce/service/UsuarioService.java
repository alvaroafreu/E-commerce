package com.example.E_commerce.service;

import com.example.E_commerce.model.Admin;
import com.example.E_commerce.model.Cliente;
import com.example.E_commerce.model.Usuario;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class UsuarioService {
    private List<Usuario> usuarios = new ArrayList<>();
    private Long contadorId = 1L;

    @PostConstruct //Serve para que quando o spring suba a aplicaçao a funçao abaixo seja chamada.
    public void criarAdminInicial(){
        Admin adminPadrao = new Admin();
        adminPadrao.setId(contadorId++);
        adminPadrao.setNome("Alvaro");
        adminPadrao.setSenha("admin123");
        adminPadrao.setEmail("alvaroafreu@gmail.com");
        usuarios.add(adminPadrao);
        System.out.println("Admin Padrao criado com sucesso! E-mail: " + adminPadrao.getEmail());

    }
    public Usuario salvar(Usuario usuario){
        usuario.setId(contadorId++);
        usuarios.add(usuario);
        return usuario;
    }
    public List<Usuario> listar() {
        return usuarios;
    }

    public void remover(Long id){
        usuarios.removeIf(usuario -> usuario.getId().equals(id));
    }

    public void atualizarParcial(Long id, Map<String, Object> campos) {
        boolean usuarioEncontrado = false;

        for (Usuario usuario : usuarios) {
            if(usuario.getId().equals(id)){
                usuarioEncontrado = true;

                // Verifica se o campo veio na requisição antes de atualizar
                if (campos.containsKey("nome")) {
                    usuario.setNome((String) campos.get("nome"));
                }
                if (campos.containsKey("email")) {
                    usuario.setEmail((String) campos.get("email"));
                }
                if (campos.containsKey("senha")) {
                    usuario.setSenha((String) campos.get("senha"));
                }

                // Tratamento específico se for Admin
                if (usuario instanceof Admin && campos.containsKey("funcao")) {
                    Admin admin = (Admin) usuario;
                    admin.setFuncao((String) campos.get("funcao"));
                }

                // Tratamento específico se for Cliente
                if (usuario instanceof Cliente && campos.containsKey("endereco")) {
                    Cliente cliente = (Cliente) usuario;
                    cliente.setEndereco((String) campos.get("endereco"));
                }

                break;
            }
        }

        if(!usuarioEncontrado){
            throw new RuntimeException("O usuário com id: " + id + " não foi encontrado!");
        }
    }
    public Usuario autenticar(String email, String senha){
        for(Usuario usuario : usuarios){
            if(usuario.getEmail().equalsIgnoreCase(email) && usuario.getSenha().equals(senha)){
                return usuario;
            }
        }
        return null;
    }

}
