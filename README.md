# E-commerce

Projeto de estudo desenvolvido com Spring Boot (Spring Web) para praticar conceitos de back-end.

## 📚 Sobre o projeto

Estou usando esse projeto para treinar e evoluir aos poucos, adicionando novas funcionalidades conforme vou aprendendo. Ainda está bem no comecinho, mas já tem uma base funcional.

## ✅ O que já funciona

- Login com diferenciação entre Administrador e Cliente
- Administrador consegue cadastrar e remover produtos
- Administrador consegue gerenciar contas de usuários
- Produtos cadastrados aparecem na tela inicial 
- Adicionar ao carrinho

## 🔧 Em desenvolvimento

- Persistência em banco de dados (hoje os dados ficam em memória, via ArrayList, e se perdem ao reiniciar)

## 🛠️ Tecnologias


- Back-end: Java + Spring Boot + Spring Web (Desenvolvido de forma autônoma)
- Front-end: HTML/CSS + JavaScript SPA (Estruturado e desenvolvido com o apoio de IA - Gemini)

## ⚙️ Como rodar

```bash
git clone https://github.com/alvaroafreu/E-commerce.git
cd E-commerce
./mvnw spring-boot:run
```

No Windows:

```bash
mvnw.cmd spring-boot:run
```

Depois é só acessar `http://localhost:8081`.
