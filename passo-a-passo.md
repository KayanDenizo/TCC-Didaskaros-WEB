# Passo a passo no outro PC

1. Confira se ele tem Node (node -v, precisa ser 20.19 ou mais novo) e XAMPP com o MySQL ligado. Se não tiver Git, baixe o ZIP pelo GitHub: botão Code e depois Download ZIP.
2. Clone o projeto:
git clone https://github.com/KayanDenizo/TCC-Didaskaros-WEB.git
cd TCC-Didaskaros-WEB
3. Instale as dependências:
npm run setup   (na raiz, instala backend e frontend)
   Dica: clone num disco local (ex.: C:\dev). Em drive de rede (Z:) o npm install leva minutos em vez de segundos.
4. Crie o arquivo backend/.env só com esta linha:
ANTHROPIC_API_KEY=sua-chave
5. Crie o banco:
cd backend; npm run db:setup; cd ..
   Nesse PC pode rodar, porque lá não tem banco nenhum pra perder.
6. Na raiz, rode npm run dev.