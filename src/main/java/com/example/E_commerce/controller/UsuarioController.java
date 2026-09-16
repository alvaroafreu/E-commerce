package com.example.E_commerce.controller;


import com.example.E_commerce.model.Admin;
import com.example.E_commerce.model.Cliente;
import com.example.E_commerce.model.LoginRequest;
import com.example.E_commerce.model.Usuario;
import com.example.E_commerce.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {
    @Autowired
    private UsuarioService usuarioService;

    @PostMapping("/cliente")
    public Cliente criarCliente(@RequestBody Cliente cliente){
        return (Cliente) usuarioService.salvar(cliente);
    }

    @PostMapping("/admin")
    public Admin criarAdmin(@RequestBody Admin admin){
        return (Admin) usuarioService.salvar(admin);
    }
    @PostMapping("/login")
    public ResponseEntity<?> fazerLogin(@RequestBody LoginRequest request){
        Usuario usuarioLogado = usuarioService.autenticar(request.getEmail(), request.getSenha());
        if(usuarioLogado == null){
            return ResponseEntity.status(401).body("Email ou senha incorretos!");
        }
        return ResponseEntity.ok(usuarioLogado);
    }
    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios(){
        List<Usuario> usuarios = usuarioService.listar();
        return ResponseEntity.ok(usuarios);
    }
    @PatchMapping("/{id}")
    public ResponseEntity<Void> atualizarUsuario(@PathVariable Long id, @RequestBody Map<String, Object> camposAtualizados){
        usuarioService.atualizarParcial(id, camposAtualizados);
        return ResponseEntity.noContent().build();
    }

}
