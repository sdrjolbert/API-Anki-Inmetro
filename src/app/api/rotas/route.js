import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Rotas disponíveis",
    rotas: [
      {
        "/api/rotas":
          "Rota atual que funciona como intermediário para rotas inexistentes ou rotas não acessíveis",
        "/api/user":
          "Em GET para recuperar e verificar usuários e em POST para criar usuários",
      },
      {
        "/api/jwt-auth/token":
          "Em POST para a criação dos tokens JWT utilizados para verificar a autenticidade dos usuários na aplicação",
      },
      {
        "/api/jwt-auth/token/validate":
          "Em POST para a verificação e autenticação do token JWT de um usuário atualmente logado",
      },
      {
        "/api/jwt-auth/token/revoke":
          "Em POST para revogar um token atualmente inválido ou de um usuário que realizou logout",
      },
      {
        "/api/apkg/import":
          "Em POST para a importação do arquivo .apkg e o armazenamento do collection no banco de dados em JSON",
      },
      {
        "/api/apkg/export":
          "Em POST para a exportação do atual deck, em JSON, do banco de dados para um arquivo .apkg compatível com o Anki",
      },
      {
        "/api/deck/get-deck":
          "Em POST para a recuperação do deck em JSON do banco de dados para utilização dentro da aplicação",
      },
      {
        "/api/deck/create-revision":
          "Em POST para a criação das revisões no banco de dados durante a ação de revisar um card",
      },
      {
        "/api/deck/create-card":
          "Em POST para a criação de cards para determinado deck",
      },
      {
        "/api/deck/create-deck":
          "Em POST para a criação de um deck completamente novo",
      },
    ],
  });
}
