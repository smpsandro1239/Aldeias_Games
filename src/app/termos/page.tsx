export const metadata = {
  title: "Termos de Serviço - Aldeias Games",
  description: "Termos e condições de uso da plataforma Aldeias Games",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-violet-600 mb-8">Termos de Serviço</h1>
        
        <div className="prose prose-violet max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introdução</h2>
            <p className="text-gray-600">
              Ao utilizar a plataforma Aldeias Games, você concorda com os presentes termos de serviço. 
              Leia-os atentamente antes de utilizar os nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Definições</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Plataforma</strong>: O site e aplicação Aldeias Games</li>
              <li><strong>Organização</strong>: Entidade (aldeia, escola, associação) que cria eventos</li>
              <li><strong>Utilizador</strong>: Pessoa que participa nos jogos e sorteios</li>
              <li><strong>Jogo</strong>: Qualquer tipo de rifa, tombola, poio da vaca ou raspadinha</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Participação</h2>
            <p className="text-gray-600">
              Para participar, o utilizador deve fornecer dados de contacto válidos. 
              A participação em jogos implica o pagamento do valor indicado. 
              Os resultados dos sorteios são definitivos e não passam recurso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Pagamentos</h2>
            <p className="text-gray-600">
              Os pagamentos são processados de forma segura. A plataforma não guarda dados de cartão de crédito.
              O utilizador é responsável por verificar a receção do bilhete após a compra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Prémios</h2>
            <p className="text-gray-600">
              Os prémios são definidos pela organização responsável pelo evento. 
              A entrega de prémios é da responsabilidade da organização. 
              Em caso de prémio em dinheiro, o valor será creditado na carteira do utilizador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Responsabilidade</h2>
            <p className="text-gray-600">
              A plataforma Aldeias Games actua como intermediário técnico. 
              Não somos responsáveis pela qualidade dos prémios ou pela entrega dos mesmos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Dados Pessoais</h2>
            <p className="text-gray-600">
              Os dados pessoais são tratados de acordo com a nossa Política de Privacidade.
              Ao utilizar a plataforma, consente o tratamento dos seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contacto</h2>
            <p className="text-gray-600">
              Para questões sobre estes termos, contacte-nos através do email: 
              suporte@aldeias.pt
            </p>
          </section>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Última actualização: {new Date().toLocaleDateString("pt-PT")}
        </p>
      </div>
    </div>
  );
}