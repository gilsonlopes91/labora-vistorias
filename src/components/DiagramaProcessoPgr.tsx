/* Diagrama do processo do GRO (E0 a E9) e dos três documentos derivados,
 * usado na página "Como funciona". Mesmo desenho do documento de referência
 * publicado no Projeto (desenho-processo-pgr.md), adaptado para cores fixas
 * em vez de variáveis CSS de tema. */
export function DiagramaProcessoPgr() {
  return (
    <figure className="my-2">
      <div className="overflow-x-auto rounded-lg border bg-white p-3">
        <svg
          viewBox="0 0 1100 430"
          className="block h-auto w-full min-w-[800px]"
          role="img"
          aria-labelledby="pgrdiag-title"
        >
          <title id="pgrdiag-title">Fluxo do processo PGR com derivados</title>
          <defs>
            <marker
              id="pgrdiag-arr"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="#5B6875" />
            </marker>
            <marker
              id="pgrdiag-arrA"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="#1F5F8B" />
            </marker>
          </defs>

          <text
            x="20"
            y="22"
            fontFamily="Arial, sans-serif"
            fontSize="11"
            fontWeight="600"
            fill="#5B6875"
            letterSpacing=".1em"
          >
            PROCESSO DO GRO (NR-1, CAP. 1.5) — DOCUMENTADO NO PGR
          </text>

          {/* linha 1: E0..E4 */}
          {[
            {
              x: 20,
              tag: 'E0',
              titulo: 'Planejamento e preparação',
              nota: 'tipo de trabalho, GHE ou não, matriz',
            },
            {
              x: 236,
              tag: 'E1',
              titulo: 'Caracterização',
              nota: 'ambientes, processos, funções, grupos',
            },
            {
              x: 452,
              tag: 'E2',
              titulo: 'Levantamento preliminar',
              nota: 'risco evidente → ação imediata',
            },
            {
              x: 668,
              tag: 'E3',
              titulo: 'Identificação de perigos',
              nota: 'perigo, fonte, grupo (3 elementos)',
            },
            {
              x: 884,
              tag: 'E4',
              titulo: 'Avaliação de riscos',
              nota: 'S × P por trilha, NR, nível, classe',
            },
          ].map((b) => (
            <g key={b.tag} transform={`translate(${b.x},36)`}>
              <rect
                width="196"
                height="70"
                rx="4"
                fill="#FFFFFF"
                stroke="#1F5F8B"
                strokeWidth="1.6"
              />
              <text
                x="12"
                y="20"
                fontFamily="Arial, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#1F5F8B"
                letterSpacing=".06em"
              >
                {b.tag}
              </text>
              <text
                x="12"
                y="40"
                fontFamily="Arial, sans-serif"
                fontSize="14"
                fontWeight="600"
                fill="#1B2430"
              >
                {b.titulo}
              </text>
              <text x="12" y="58" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
                {b.nota}
              </text>
            </g>
          ))}
          <path
            d="M216,71 L234,71"
            fill="none"
            stroke="#5B6875"
            strokeWidth="1.4"
            markerEnd="url(#pgrdiag-arr)"
          />
          <path
            d="M432,71 L450,71"
            fill="none"
            stroke="#5B6875"
            strokeWidth="1.4"
            markerEnd="url(#pgrdiag-arr)"
          />
          <path
            d="M648,71 L666,71"
            fill="none"
            stroke="#5B6875"
            strokeWidth="1.4"
            markerEnd="url(#pgrdiag-arr)"
          />
          <path
            d="M864,71 L882,71"
            fill="none"
            stroke="#5B6875"
            strokeWidth="1.4"
            markerEnd="url(#pgrdiag-arr)"
          />

          <path
            d="M982,106 L982,124 L118,124 L118,140"
            fill="none"
            stroke="#5B6875"
            strokeWidth="1.4"
            markerEnd="url(#pgrdiag-arr)"
          />

          {/* linha 2: E5..E9 */}
          {[
            {
              x: 20,
              tag: 'E5',
              titulo: 'Medidas e plano de ação',
              nota: 'hierarquia, prazo, responsável, aferição',
            },
            {
              x: 236,
              tag: 'E6',
              titulo: 'Emergências',
              nota: 'cenários, meios, abandono, simulados',
            },
            {
              x: 452,
              tag: 'E7',
              titulo: 'Documentação e emissão',
              nota: 'critérios, inventário, plano, PDF, trava',
            },
            {
              x: 668,
              tag: 'E8',
              titulo: 'Acompanhamento',
              nota: 'verificação, inspeções, PCMSO, acidentes',
            },
            { x: 884, tag: 'E9', titulo: 'Revisão', nota: '2 anos ou 6 gatilhos; versão nova' },
          ].map((b) => (
            <g key={b.tag} transform={`translate(${b.x},142)`}>
              <rect
                width="196"
                height="70"
                rx="4"
                fill="#FFFFFF"
                stroke="#1F5F8B"
                strokeWidth="1.6"
              />
              <text
                x="12"
                y="20"
                fontFamily="Arial, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#1F5F8B"
                letterSpacing=".06em"
              >
                {b.tag}
              </text>
              <text
                x="12"
                y="40"
                fontFamily="Arial, sans-serif"
                fontSize="14"
                fontWeight="600"
                fill="#1B2430"
              >
                {b.titulo}
              </text>
              <text x="12" y="58" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
                {b.nota}
              </text>
            </g>
          ))}
          <path
            d="M216,177 L234,177"
            fill="none"
            stroke="#5B6875"
            strokeWidth="1.4"
            markerEnd="url(#pgrdiag-arr)"
          />
          <path
            d="M432,177 L450,177"
            fill="none"
            stroke="#5B6875"
            strokeWidth="1.4"
            markerEnd="url(#pgrdiag-arr)"
          />
          <path
            d="M648,177 L666,177"
            fill="none"
            stroke="#5B6875"
            strokeWidth="1.4"
            markerEnd="url(#pgrdiag-arr)"
          />
          <path
            d="M864,177 L882,177"
            fill="none"
            stroke="#5B6875"
            strokeWidth="1.4"
            markerEnd="url(#pgrdiag-arr)"
          />

          <path
            d="M982,212 L982,236 L550,236 L550,108"
            fill="none"
            stroke="#1F5F8B"
            strokeWidth="1.4"
            strokeDasharray="5 4"
            markerEnd="url(#pgrdiag-arrA)"
          />
          <text x="560" y="232" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
            revisão reavalia só o que mudou
          </text>

          <text
            x="20"
            y="284"
            fontFamily="Arial, sans-serif"
            fontSize="11"
            fontWeight="600"
            fill="#5B6875"
            letterSpacing=".1em"
          >
            DERIVADOS — LEEM O MESMO LEVANTAMENTO, CONCLUEM POR FUNÇÃO COM RÉGUA PRÓPRIA (NR-1,
            1.5.2)
          </text>

          <path
            d="M190,262 L910,262"
            fill="none"
            stroke="#8A3B9C"
            strokeWidth="1.2"
            strokeDasharray="3 4"
          />
          <path
            d="M190,262 L190,300"
            fill="none"
            stroke="#8A3B9C"
            strokeWidth="1.2"
            strokeDasharray="3 4"
          />
          <path
            d="M550,262 L550,300"
            fill="none"
            stroke="#8A3B9C"
            strokeWidth="1.2"
            strokeDasharray="3 4"
          />
          <path
            d="M910,262 L910,300"
            fill="none"
            stroke="#8A3B9C"
            strokeWidth="1.2"
            strokeDasharray="3 4"
          />
          <text x="20" y="266" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
            dados de E1, E3 e E4 →
          </text>

          <g transform="translate(20,300)">
            <rect
              width="340"
              height="100"
              rx="4"
              fill="#FFFFFF"
              stroke="#8A3B9C"
              strokeWidth="1.6"
            />
            <text
              x="12"
              y="22"
              fontFamily="Arial, sans-serif"
              fontSize="11"
              fontWeight="600"
              fill="#8A3B9C"
              letterSpacing=".06em"
            >
              LAUDO DE INSALUBRIDADE · NR-15
            </text>
            <text
              x="12"
              y="44"
              fontFamily="Arial, sans-serif"
              fontSize="14"
              fontWeight="600"
              fill="#1B2430"
            >
              Exposição × limite ou atividade listada
            </text>
            <text x="12" y="62" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
              agentes com anexo na NR-15; EPI neutraliza só com CA,
            </text>
            <text x="12" y="78" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
              fornecimento e uso comprovado; só o maior grau por função
            </text>
            <text x="12" y="94" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
              assina: médico ou eng. de segurança (CLT 195)
            </text>
          </g>
          <g transform="translate(380,300)">
            <rect
              width="340"
              height="100"
              rx="4"
              fill="#FFFFFF"
              stroke="#8A3B9C"
              strokeWidth="1.6"
            />
            <text
              x="12"
              y="22"
              fontFamily="Arial, sans-serif"
              fontSize="11"
              fontWeight="600"
              fill="#8A3B9C"
              letterSpacing=".06em"
            >
              LAUDO DE PERICULOSIDADE · NR-16
            </text>
            <text
              x="12"
              y="44"
              fontFamily="Arial, sans-serif"
              fontSize="14"
              fontWeight="600"
              fill="#1B2430"
            >
              Anexo, item e frequência da exposição
            </text>
            <text x="12" y="62" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
              permanente ou intermitente: devido; eventual: não;
            </text>
            <text x="12" y="78" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
              áreas de risco de inflamáveis; motocicleta (Anexo 5)
            </text>
            <text x="12" y="94" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
              assina: médico ou eng. de segurança (NR-16, 16.3)
            </text>
          </g>
          <g transform="translate(740,300)">
            <rect
              width="340"
              height="100"
              rx="4"
              fill="#FFFFFF"
              stroke="#8A3B9C"
              strokeWidth="1.6"
            />
            <text
              x="12"
              y="22"
              fontFamily="Arial, sans-serif"
              fontSize="11"
              fontWeight="600"
              fill="#8A3B9C"
              letterSpacing=".06em"
            >
              LTCAT · DECRETO 3.048 / IN 128
            </text>
            <text
              x="12"
              y="44"
              fontFamily="Arial, sans-serif"
              fontSize="14"
              fontWeight="600"
              fill="#1B2430"
            >
              Anexo IV, habitual e permanente
            </text>
            <text x="12" y="62" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
              ruído NEN q=3 &gt; 85 dB(A); EPC com manutenção;
            </text>
            <text x="12" y="78" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
              EPI nunca no ruído; checklist do art. 276 bloqueia
            </text>
            <text x="12" y="94" fontFamily="Georgia, serif" fontSize="10.5" fill="#5B6875">
              assina: médico ou eng. de segurança (Lei 8.213, 58 §1º)
            </text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        As dez etapas do processo (E0 a E9) na sequência do manual, o ciclo de revisão, e os três
        documentos derivados que leem o mesmo levantamento com réguas próprias (NR-1, 1.5.2).
      </figcaption>
    </figure>
  )
}

export default DiagramaProcessoPgr
