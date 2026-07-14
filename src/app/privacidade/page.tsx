export const metadata = {
  title: "Política de Privacidade - Aldeias Games",
  description: "Política de privacidade e proteção de dados pessoais",
};

import { LayoutHeader } from "@/components/layout-header";

export default function PrivacidadePage() {
  return (
    <LayoutHeader>
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-black text-violet-600 mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-violet max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introdução</h2>
            <p className="text-gray-600">
              A Aldeias Games respeita a sua privacidade e compromete-se a proteger os seus dados pessoais.
              Esta política explica como recolhemos, utilizamos e protegemos as suas informações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Dados Recolhidos</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Nome e dados de contacto (email, telefone)</li>
              <li>Informações de pagamento (processadas por terceiros seguros)</li>
              <li>Histórico de participações em jogos</li>
              <li>Dados de utilização da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Finalidade do Tratamento</h2>
            <p className="text-gray-600">
              Os seus dados são utilizados para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Processar as suas participações em jogos</li>
              <li>Comunicar resultados e通知vencedores</li>
              <li>Enviar comprovativos de compra</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Base Legal</h2>
            <p className="text-gray-600">
              O tratamento dos seus dados baseia-se no seu consentimento e na execução do contrato 
              de participação nos jogos. Pode retirar o consentimento a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Direitos do Utilizador</h2>
            <p className="text-gray-600">
              Tem direito a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Aceder aos seus dados pessoais</li>
              <li>Retificar dados incorretos</li>
              <li>Apagar os seus dados ("direito ao esquecimento")</li>
              <li>Limitação do tratamento</li>
              <li>Portabilidade dos dados</li>
              <li>Oposição ao tratamento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Segurança</h2>
            <p className="text-gray-600">
              Implementamos medidas técnicas e organizativas adequadas para proteger os seus dados contra 
              acesso não autorizado, alteração ou destruição. Os dados são armazenados em servidores seguros 
              na União Europeia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Retenção</h2>
            <p className="text-gray-600">
              Os dados são mantidos apenas pelo tempo necessário para as finalidades descritas, 
              ou conforme exigido por lei. Após a conclusão do evento, os dados podem ser eliminados 
              ou anonimizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contacto</h2>
            <p className="text-gray-600">
              Para exercer os seus direitos ou esclarecer dúvidas sobre esta política, contacte-nos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Email: privacidade@aldeias.pt</li>
              <li>Através da plataforma na secção de suporte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Autoridade de Controlo</h2>
            <p className="text-gray-600">
              Se considera que o tratamento dos seus dados viola a legislação de proteção de dados, 
              tem direito a apresentar reclamação junto da Comissão Nacional de Proteção de Dados (CNPD).
            </p>
          </section>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Última actualização: {new Date().toLocaleDateString("pt-PT")}
         </p>
       </div>
       </div>
     </LayoutHeader>
  );
}