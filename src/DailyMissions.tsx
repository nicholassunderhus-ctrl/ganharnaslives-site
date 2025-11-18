import React, { useState, useEffect } from 'react';

// --- Configuração das Missões ---
const MISSIONS = [
  { id: 1, text: 'Clique para uma dose de sabedoria diária!', points: 10 },
  { id: 2, text: 'Descubra um fato inútil, mas divertido!', points: 10 },
  { id: 3, text: 'Ative seu bônus de sorte do dia!', points: 10 },
  { id: 4, text: 'Colete sua energia extra para assistir!', points: 10 },
  { id: 5, text: 'Verifique se hoje é seu dia de sorte!', points: 10 },
  { id: 6, text: 'Clique aqui e pense em algo bom.', points: 10 },
  { id: 7, text: 'Resgate seu prêmio por ser incrível!', points: 10 },
  { id: 8, text: 'Uma piscadela do universo para você.', points: 10 },
  { id: 9, text: 'Abra uma porta para o desconhecido.', points: 10 },
  { id: 10, text: 'Sua tarefa boba do dia está aqui!', points: 10 },
  { id: 11, text: 'Clique para receber um elogio aleatório.', points: 10 },
  { id: 12, text: 'Descubra uma nova cor que não existe.', points: 10 },
  { id: 13, text: 'Valide seu ticket de diversão diário.', points: 10 },
  { id: 14, text: 'Receba uma recomendação de música.', points: 10 },
  { id: 15, text: 'Um clique para um futuro mais brilhante.', points: 10 },
  { id: 16, text: 'Confirme sua presença no clube dos ganhadores.', points: 10 },
  { id: 17, text: 'Sua missão, caso decida aceitar...', points: 10 },
  { id: 18, text: 'Clique e veja a mágica acontecer.', points: 10 },
  { id: 19, text: 'Resgate um sorriso virtual.', points: 10 },
  { id: 20, text: 'Parabéns por chegar até aqui! Clique para coletar.', points: 10 },
];

const DailyMissions: React.FC = () => {
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);

  // Efeito para carregar dados do localStorage e resetar se for um novo dia
  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('missionsLastResetDate');
    
    if (storedDate !== today) {
      // É um novo dia, reseta as missões
      localStorage.setItem('completedMissions', '[]');
      localStorage.setItem('missionsLastResetDate', today);
      setCompletedMissions([]);
    } else {
      // Mesmo dia, carrega o progresso
      const storedCompleted = JSON.parse(localStorage.getItem('completedMissions') || '[]');
      setCompletedMissions(storedCompleted);
    }
  }, []);

  const handleMissionClick = (missionId: number, points: number) => {
    if (completedMissions.includes(missionId)) {
      return; // Não faz nada se a missão já foi completada
    }

    // 1. O clique no botão vai acionar os anúncios "onclick" que você já tem.
    //    Não é preciso adicionar nenhum código de anúncio novo aqui!

    // 2. Adiciona os pontos ao usuário (substitua pela sua lógica real)
    console.log(`Adicionando ${points} pontos ao usuário!`);
    // Exemplo: updateUserPoints(currentPoints + points);

    // 3. Marca a missão como completa e salva no estado e no localStorage
    const updatedCompletedMissions = [...completedMissions, missionId];
    setCompletedMissions(updatedCompletedMissions);
    localStorage.setItem('completedMissions', JSON.stringify(updatedCompletedMissions));
  };

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px', borderBottom: '2px solid #4a5568', paddingBottom: '10px' }}>
        Missões Diárias
      </h1>
      <p style={{ marginBottom: '25px', color: '#a0aec0' }}>
        Complete tarefas simples para ganhar pontos extras. As missões são renovadas a cada 24 horas.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {MISSIONS.map((mission) => (
          <button
            key={mission.id}
            onClick={() => handleMissionClick(mission.id, mission.points)}
            disabled={completedMissions.includes(mission.id)}
            style={{
              padding: '15px 20px',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: completedMissions.includes(mission.id) ? '#4a5568' : '#4299e1',
              border: 'none',
              borderRadius: '8px',
              cursor: completedMissions.includes(mission.id) ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.2s',
              opacity: completedMissions.includes(mission.id) ? 0.6 : 1,
            }}
          >
            {mission.text}
            <span style={{ float: 'right', fontWeight: 'normal', color: '#bee3f8' }}>
              {completedMissions.includes(mission.id) ? 'Concluído ✓' : `+${mission.points} Pontos`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DailyMissions;