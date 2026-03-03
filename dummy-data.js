// Dummy data for HTML files
// This mirrors the structure from FrontEnd/lib/dummyData.ts

const DUMMY_TOURNAMENTS = [
  {
    id: '1',
    name: 'PLAYERS CHAMPIONSHIP',
    dateRange: 'FEB 01 - 04, 2026',
    backgroundImage: 'Images/Masters.jpg',
    state: 'completed',
    draftStartDate: '2026-01-28',
    startDate: '2026-02-01',
    endDate: '2026-02-04',
  },
  {
    id: '2',
    name: 'THE MASTERS',
    dateRange: 'MAR 01 - 04, 2026',
    backgroundImage: 'Images/Masters.jpg',
    state: 'completed',
    draftStartDate: '2026-02-26',
    startDate: '2026-03-01',
    endDate: '2026-03-04',
  },
  {
    id: '3',
    name: 'PGA CHAMPIONSHIP',
    dateRange: 'APR 01 - 04, 2026',
    backgroundImage: 'Images/Masters.jpg',
    state: 'completed',
    draftStartDate: '2026-03-28',
    startDate: '2026-04-01',
    endDate: '2026-04-04',
  },
  {
    id: '4',
    name: 'U.S. OPEN',
    dateRange: 'MAY 01 - 04, 2026',
    backgroundImage: 'Images/Masters.jpg',
    state: 'draft',
    draftStartDate: '2026-04-28',
    startDate: '2026-05-01',
    endDate: '2026-05-04',
  },
  {
    id: '5',
    name: 'OPEN CHAMPIONSHIP',
    dateRange: 'JUN 01 - 04, 2026',
    backgroundImage: 'Images/Masters.jpg',
    state: 'pre-draft',
    draftStartDate: '2026-05-28',
    startDate: '2026-06-01',
    endDate: '2026-06-04',
  },
  {
    id: '6',
    name: 'FEDEX ST. JUDE',
    dateRange: 'JUL 01 - 04, 2026',
    backgroundImage: 'Images/Masters.jpg',
    state: 'pre-draft',
    draftStartDate: '2026-06-28',
    startDate: '2026-07-01',
    endDate: '2026-07-04',
  },
  {
    id: '7',
    name: 'BMW CHAMPIONSHIP',
    dateRange: 'AUG 01 - 04, 2026',
    backgroundImage: 'Images/Masters.jpg',
    state: 'pre-draft',
    draftStartDate: '2026-07-28',
    startDate: '2026-08-01',
    endDate: '2026-08-04',
  },
  {
    id: '8',
    name: 'TOUR CHAMPIONSHIP',
    dateRange: 'SEP 01 - 04, 2026',
    backgroundImage: 'Images/Masters.jpg',
    state: 'pre-draft',
    draftStartDate: '2026-08-28',
    startDate: '2026-09-01',
    endDate: '2026-09-04',
  },
  {
    id: '9',
    name: 'RYDER CUP',
    dateRange: 'OCT 01 - 04, 2026',
    backgroundImage: 'Images/Masters.jpg',
    state: 'pre-draft',
    draftStartDate: '2026-09-28',
    startDate: '2026-10-01',
    endDate: '2026-10-04',
  },
];

// Helper functions
function getCurrentTournament() {
  return DUMMY_TOURNAMENTS.find(t => t.id === '4') || DUMMY_TOURNAMENTS[0];
}

function getTournamentById(id) {
  return DUMMY_TOURNAMENTS.find(t => t.id === id) || getCurrentTournament();
}

function getTournamentState(tournament) {
  // Use explicit state if available
  if (tournament.state) {
    return tournament.state;
  }
  
  // Otherwise calculate based on dates
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (tournament.endDate) {
    const endDate = new Date(tournament.endDate);
    if (now > endDate) {
      return 'completed';
    }
  }
  
  if (tournament.startDate) {
    const startDate = new Date(tournament.startDate);
    if (now >= startDate) {
      return 'playing';
    }
  }
  
  if (tournament.draftStartDate) {
    const draftStartDate = new Date(tournament.draftStartDate);
    if (now >= draftStartDate) {
      return 'draft';
    }
  }
  
  return 'pre-draft';
}

// Dummy players
const DUMMY_PLAYERS = [
  { id: '1', name: 'MtyThor', imageUrl: 'Images/Player_MtyThor.jpg' },
  { id: '2', name: 'Atticus', imageUrl: 'Images/Player_Atticus.jpg' },
  { id: '3', name: 'KristaKay', imageUrl: 'Images/Player_KristaKay.jpg' },
  { id: '4', name: 'MrHattyhat', imageUrl: 'Images/Player_MrHattyhat.jpg' },
];

// Golfer names list (same as TypeScript)
const GOLFER_NAMES = [
  'Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm', 'Brooks Koepka', 'Jordan Spieth',
  'Justin Thomas', 'Dustin Johnson', 'Patrick Cantlay', 'Xander Schauffele', 'Collin Morikawa',
  'Viktor Hovland', 'Matt Fitzpatrick', 'Tommy Fleetwood', 'Tyrrell Hatton', 'Shane Lowry',
  'Cameron Smith', 'Sam Burns', 'Max Homa', 'Tony Finau', 'Sungjae Im',
  'Hideki Matsuyama', 'Jason Day', 'Adam Scott', 'Marc Leishman', 'Louis Oosthuizen',
  'Bryson DeChambeau', 'Daniel Berger', 'Keegan Bradley', 'Russell Henley', 'Brian Harman',
  'Harris English', 'Sepp Straka', 'Ludvig Aberg', 'Nicolai Hojgaard', 'Tom Kim',
  'Robert MacIntyre', 'Alex Noren', 'Aaron Wise', 'Sahith Theegala', 'Kurt Kitayama',
  'Andrew Novak', 'Michael Kim', 'Ben Griffin', 'Justin Rose', 'Gary Woodland',
  'Erik Van Rooyen', 'Joaquin Niemann', 'Taylor Pendrith', 'Wyndham Clark', 'Rickie Fowler',
  'Bubba Watson', 'Phil Mickelson', 'Tiger Woods', 'Fred Couples', 'Davis Love III',
  'Webb Simpson', 'Kevin Kisner', 'Billy Horschel', 'Stewart Cink', 'Charley Hoffman',
  'J.T. Poston', 'Brendon Todd', 'Emiliano Grillo', 'Francesco Molinari', 'Adrian Otaegui',
  'Rasmus Hojgaard', 'Thorbjorn Bjorn', 'Henrik Stenson', 'Sergio Garcia', 'Pablo Larrazabal',
  'Jorge Campillo', 'Carlos Ortiz', 'Miguel Ancer', 'Eduardo Rodriguez', 'Alejandro Cabrera Bello',
  'Rafael Paratore', 'Jose Schwartzel', 'Lucas Grace', 'Matthias Frittelli', 'Martin Higgo',
  'Thomas Pieters', 'Christiaan Willett', 'Dean Casey', 'Branden Westwood', 'Charl Poulter',
  'Ernie Rose', 'Retief Fitzpatrick', 'Louis Wallace', 'Dylan Fox', 'Garrick Power',
  'Cameron Young', 'Ryan Palmer', 'Brendan Steele', 'Lucas Glover', 'Maverick List',
  'Pierceson Hughes', 'Gordon Conners', 'Nick Taylor', 'Luke Donald', 'David Lingmerth',
  'Matt Kuchar', 'Zach Johnson', 'Jim Furyk', 'Steve Stricker', 'Stewart Cink'
];

// Scoring constants (matching TypeScript)
const SCORING = {
  BASE_POINTS_FORMULA: (position) => 100 - position,
  BONUS_POINTS: {
    FIRST_PLACE: 6,
    TOP_5: 5,
    TOP_10: 4,
    TOP_20: 3,
    BELOW_20: 0,
  },
  MISSED_CUT: 0,
};

// Generate golfers for a tournament
function generateGolfers(tournamentId) {
  return GOLFER_NAMES.map((name, index) => ({
    id: `golfer-${tournamentId}-${index + 1}`,
    name: name,
    rank: index + 1,
    odds: generateOdds(index + 1),
  }));
}

// Generate odds string
function generateOdds(rank) {
  if (rank <= 5) return `${3 + rank}/1`;
  if (rank <= 10) return `${10 + (rank - 5) * 2}/1`;
  if (rank <= 20) return `${20 + (rank - 10) * 3}/1`;
  if (rank <= 30) return `${50 + (rank - 20) * 5}/1`;
  if (rank <= 50) return `${100 + (rank - 30) * 10}/1`;
  return `${300 + (rank - 50) * 20}/1`;
}

// Calculate points
function calculatePoints(finalPosition) {
  if (finalPosition === null) {
    return { basePoints: 0, bonusPoints: 0, totalPoints: 0 };
  }
  
  const basePoints = SCORING.BASE_POINTS_FORMULA(finalPosition);
  let bonusPoints = 0;
  
  if (finalPosition === 1) {
    bonusPoints = SCORING.BONUS_POINTS.FIRST_PLACE;
  } else if (finalPosition >= 2 && finalPosition <= 5) {
    bonusPoints = SCORING.BONUS_POINTS.TOP_5;
  } else if (finalPosition >= 6 && finalPosition <= 10) {
    bonusPoints = SCORING.BONUS_POINTS.TOP_10;
  } else if (finalPosition >= 11 && finalPosition <= 20) {
    bonusPoints = SCORING.BONUS_POINTS.TOP_20;
  }
  
  return {
    basePoints: basePoints,
    bonusPoints: bonusPoints,
    totalPoints: basePoints + bonusPoints,
  };
}

// Generate round scores
function generateRoundScores(finalPosition, round, golferIndex) {
  if (finalPosition === null) {
    if (round <= 2) {
      const score = 72 + ((golferIndex + round) % 8) + 1;
      return {
        round: round,
        score: score,
        toPar: score - 72,
      };
    }
    return { round: round, score: 0, toPar: 0 };
  }
  
  let baseScore = 72;
  if (finalPosition <= 5) baseScore = 68;
  else if (finalPosition <= 10) baseScore = 69;
  else if (finalPosition <= 20) baseScore = 70;
  else if (finalPosition <= 30) baseScore = 71;
  else if (finalPosition <= 50) baseScore = 72;
  else baseScore = 73;
  
  const variance = ((golferIndex * 7 + round * 3) % 5) - 2;
  const score = Math.max(65, Math.min(80, baseScore + variance));
  
  return {
    round: round,
    score: score,
    toPar: score - 72,
  };
}

// Create shuffled positions (deterministic)
function createShuffledPositions(seed, cutLine = 70) {
  const positions = Array(100).fill(null);
  const positionNumbers = Array.from({ length: 100 }, (_, i) => i + 1);
  
  const shuffle = (arr, seed) => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = (seed * (i + 1) * 7 + i * 3) % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  
  const shuffled = shuffle(positionNumbers, seed);
  
  for (let i = 0; i < 100; i++) {
    if (i < cutLine) {
      positions[i] = shuffled[i];
    } else {
      positions[i] = null;
    }
  }
  
  return positions;
}

// Predefined final positions for completed tournaments
const TOURNAMENT_FINAL_POSITIONS = {
  '1': createShuffledPositions(1, 70),
  '2': createShuffledPositions(2, 70),
  '3': createShuffledPositions(3, 70),
};

// Predefined Fat Rando stolen golfers
const FAT_RANDO_STOLEN = {
  '1': [2, 5, 12, 18],
  '2': [1, 8, 15, 20],
  '3': [3, 7, 11, 19],
};

// Predefined team drafts
const TEAM_DRAFTS = {
  '1': [
    { playerId: '1', activeGolfers: [1, 6, 13], alternateGolfer: 19 },
    { playerId: '2', activeGolfers: [3, 7, 14], alternateGolfer: 20 },
    { playerId: '3', activeGolfers: [4, 8, 15], alternateGolfer: 21 },
    { playerId: '4', activeGolfers: [9, 10, 16], alternateGolfer: 22 },
  ],
  '2': [
    { playerId: '1', activeGolfers: [2, 6, 11], alternateGolfer: 17 },
    { playerId: '2', activeGolfers: [3, 9, 12], alternateGolfer: 18 },
    { playerId: '3', activeGolfers: [4, 7, 13], alternateGolfer: 19 },
    { playerId: '4', activeGolfers: [5, 10, 14], alternateGolfer: 20 },
  ],
  '3': [
    { playerId: '1', activeGolfers: [1, 8, 15], alternateGolfer: 22 },
    { playerId: '2', activeGolfers: [2, 9, 16], alternateGolfer: 23 },
    { playerId: '3', activeGolfers: [4, 10, 17], alternateGolfer: 24 },
    { playerId: '4', activeGolfers: [5, 11, 18], alternateGolfer: 25 },
  ],
};

// Generate tournament results (matching TypeScript logic)
function generateTournamentResult(tournamentId, golfers) {
  const tournament = DUMMY_TOURNAMENTS.find(t => t.id === tournamentId);
  if (!tournament || tournament.state !== 'completed') {
    return null;
  }

  const finalPositions = TOURNAMENT_FINAL_POSITIONS[tournamentId];
  if (!finalPositions) return null;

  const stolenRanks = FAT_RANDO_STOLEN[tournamentId];
  if (!stolenRanks) return null;

  const stolenGolferIds = stolenRanks.map(rank => golfers[rank - 1].id);
  
  // Generate golfer results
  const golferResults = golfers.map((golfer, index) => {
    const finalPosition = finalPositions[index];
    const rounds = [];
    let totalScore = 0;
    let totalToPar = 0;
    
    if (finalPosition === null) {
      for (let r = 1; r <= 2; r++) {
        const roundScore = generateRoundScores(null, r, index);
        rounds.push(roundScore);
        totalScore += roundScore.score;
        totalToPar += roundScore.toPar;
      }
    } else {
      for (let r = 1; r <= 4; r++) {
        const roundScore = generateRoundScores(finalPosition, r, index);
        rounds.push(roundScore);
        totalScore += roundScore.score;
        totalToPar += roundScore.toPar;
      }
    }
    
    const { basePoints, bonusPoints, totalPoints } = calculatePoints(finalPosition);
    
    return {
      golferId: golfer.id,
      finalPosition: finalPosition,
      rounds: rounds,
      totalScore: totalScore,
      totalToPar: totalToPar,
      madeCut: finalPosition !== null,
      basePoints: basePoints,
      bonusPoints: bonusPoints,
      totalPoints: totalPoints,
    };
  });
  
  // Create team drafts from predefined data
  // First, create a map of available golfers (not stolen) sorted by rank
  const availableGolfersSorted = golfers
    .filter((g, index) => !stolenRanks.includes(index + 1))
    .sort((a, b) => a.rank - b.rank);
  
  const teamDrafts = TEAM_DRAFTS[tournamentId].map((draft, playerIndex) => {
    // Each player drafts from available golfers in order
    // Simple round-robin: player 0 gets picks 0,4,8,12; player 1 gets 1,5,9,13; etc.
    const picksPerPlayer = 4;
    const startIndex = playerIndex * picksPerPlayer;
    
    const activeGolfers = [];
    for (let i = 0; i < 3; i++) {
      const golferIndex = (startIndex + i) % availableGolfersSorted.length;
      activeGolfers.push(availableGolfersSorted[golferIndex].id);
    }
    
    const alternateIndex = (startIndex + 3) % availableGolfersSorted.length;
    const alternateGolfer = availableGolfersSorted[alternateIndex].id;
    
    return {
      playerId: draft.playerId,
      activeGolfers: activeGolfers,
      alternateGolfer: alternateGolfer,
    };
  });
  
  // Calculate team scores
  const teamScores = teamDrafts.map(draft => {
    const golferPoints = draft.activeGolfers.map(golferId => {
      const result = golferResults.find(r => r.golferId === golferId);
      if (!result || !result.madeCut) {
        const alternateResult = golferResults.find(r => r.golferId === draft.alternateGolfer);
        if (alternateResult && alternateResult.madeCut) {
          return {
            golferId: draft.alternateGolfer,
            points: alternateResult.totalPoints,
          };
        }
        return { golferId: golferId, points: 0 };
      }
      return { golferId: golferId, points: result.totalPoints };
    });
    
    const totalPoints = golferPoints.reduce((sum, gp) => sum + gp.points, 0);
    
    return {
      playerId: draft.playerId,
      totalPoints: totalPoints,
      golferPoints: golferPoints,
    };
  });
  
  return {
    tournamentId: tournamentId,
    fatRandoStolenGolfers: stolenGolferIds,
    teamDrafts: teamDrafts,
    golferResults: golferResults,
    teamScores: teamScores,
  };
}

// Cache for generated data
const generatedGolfers = {};
const generatedResults = {};

// Helper function to get tournament results data
function getTournamentResultsData(tournamentId) {
  // Only tournaments 1-3 have completed results
  if (tournamentId !== '1' && tournamentId !== '2' && tournamentId !== '3') {
    return null;
  }
  
  // Generate if not cached
  if (!generatedResults[tournamentId]) {
    if (!generatedGolfers[tournamentId]) {
      generatedGolfers[tournamentId] = generateGolfers(tournamentId);
    }
    const golfers = generatedGolfers[tournamentId];
    generatedResults[tournamentId] = generateTournamentResult(tournamentId, golfers);
  }
  
  return generatedResults[tournamentId];
}

// Helper function to get golfer by ID
function getGolferById(tournamentId, golferId) {
  if (!generatedGolfers[tournamentId]) {
    generatedGolfers[tournamentId] = generateGolfers(tournamentId);
  }
  return generatedGolfers[tournamentId].find(g => g.id === golferId) || null;
}

// Tournament picker functionality - works with existing HTML structure
function initializeTournamentPicker(containerSelector, onSelect) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const header = container.querySelector('.tournament-picker-header');
  const nameElement = container.querySelector('.tournament-picker-name');
  const dateElement = container.querySelector('.tournament-picker-date');
  const caret = container.querySelector('.tournament-picker-caret i');
  const dropdown = container.querySelector('.tournament-picker-dropdown');
  
  if (!dropdown) return; // Need existing dropdown structure
  
  let currentTournament = getCurrentTournament();
  
  // Update display
  function updateDisplay(tournament) {
    if (nameElement) nameElement.textContent = tournament.name;
    if (dateElement) dateElement.textContent = tournament.dateRange;
  }
  
  // Populate dropdown with dummy data - works with existing structure
  function populateDropdown() {
    // Clear existing options
    dropdown.innerHTML = '';
    
    // Create options from dummy data
    DUMMY_TOURNAMENTS.forEach(tournament => {
      const option = document.createElement('div');
      option.className = 'tournament-picker-option';
      option.setAttribute('data-name', 'Tournament Info');
      
      const namePara = document.createElement('p');
      namePara.className = 'tournament-picker-option-name';
      namePara.textContent = tournament.name;
      
      const datePara = document.createElement('p');
      datePara.className = 'tournament-picker-option-date';
      datePara.textContent = tournament.dateRange;
      
      option.appendChild(namePara);
      option.appendChild(datePara);
      
      // Add click handler
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        currentTournament = tournament;
        updateDisplay(tournament);
        
        // Update all options to reflect selection
        const allOptions = dropdown.querySelectorAll('.tournament-picker-option');
        allOptions.forEach(opt => {
          if (opt === option) {
            opt.style.backgroundColor = '#1f1f1f';
            opt.style.fontWeight = '800';
          } else {
            opt.style.backgroundColor = 'transparent';
            opt.style.fontWeight = '400';
          }
        });
        
        // Close dropdown
        container.classList.remove('open');
        if (caret) {
          caret.classList.remove('fa-caret-up');
          caret.classList.add('fa-caret-down');
        }
        
        if (onSelect) onSelect(tournament);
      });
      
      // Hover effects
      option.addEventListener('mouseenter', function() {
        if (tournament.id !== currentTournament.id) {
          option.style.backgroundColor = '#1f1f1f';
        }
      });
      
      option.addEventListener('mouseleave', function() {
        if (tournament.id !== currentTournament.id) {
          option.style.backgroundColor = 'transparent';
        }
      });
      
      // Set initial styling for selected tournament
      if (tournament.id === currentTournament.id) {
        option.style.backgroundColor = '#1f1f1f';
        option.style.fontWeight = '800';
      }
      
      dropdown.appendChild(option);
    });
  }
  
  // Initialize
  populateDropdown();
  updateDisplay(currentTournament);
  
  // Return object for external control
  return {
    getCurrentTournament: () => currentTournament,
    setTournament: (tournament) => {
      currentTournament = tournament;
      updateDisplay(tournament);
      populateDropdown(); // Re-populate to update selection highlighting
    }
  };
}
