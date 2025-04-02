// Load player stats from JSON
async function loadPlayers() {
    const response = await fetch("player_Stats.json");
    return await response.json();
}

// Load team stats from JSON
async function loadTeams() {
    const response = await fetch("team_Stats.json");
    return await response.json();
}

// Team name mappings
const teamMapping = {
    "ATL": "Atlanta Hawks", "BOS": "Boston Celtics", "BKN": "Brooklyn Nets",
    "CHA": "Charlotte Hornets", "CHI": "Chicago Bulls", "CLE": "Cleveland Cavaliers",
    "DAL": "Dallas Mavericks", "DEN": "Denver Nuggets", "DET": "Detroit Pistons",
    "GSW": "Golden State Warriors", "HOU": "Houston Rockets", "IND": "Indiana Pacers",
    "LAC": "Los Angeles Clippers", "LAL": "Los Angeles Lakers", "MEM": "Memphis Grizzlies",
    "MIA": "Miami Heat", "MIL": "Milwaukee Bucks", "MIN": "Minnesota Timberwolves",
    "NOP": "New Orleans Pelicans", "NYK": "New York Knicks", "OKC": "Oklahoma City Thunder",
    "ORL": "Orlando Magic", "PHI": "Philadelphia 76ers", "PHX": "Phoenix Suns",
    "POR": "Portland Trail Blazers", "SAC": "Sacramento Kings", "SAS": "San Antonio Spurs",
    "TOR": "Toronto Raptors", "UTA": "Utah Jazz", "WAS": "Washington Wizards"
};

const reverseTeamMapping = Object.fromEntries(
    Object.entries(teamMapping).map(([abbr, fullName]) => [fullName, abbr])
);

// Fetch and populate teams dropdown
async function populateTeams() {
    console.log("populateTeams called");
    const teamsDropdown = document.getElementById("teamSelect");
    const opponentDropdown = document.getElementById("opponentSelect");

    if (!teamsDropdown || !opponentDropdown) {
        console.error("Dropdown elements not found!");
        return;
    }

    teamsDropdown.innerHTML = '<option value="">Select Team</option>'; // Reset
    opponentDropdown.innerHTML = '<option value="">Select Opponent</option>'; // Reset

    Object.values(teamMapping).forEach(team => {
        let option1 = document.createElement("option");
        option1.value = team;
        option1.textContent = team;
        teamsDropdown.appendChild(option1);

        let option2 = document.createElement("option");
        option2.value = team;
        option2.textContent = team;
        opponentDropdown.appendChild(option2);
    });

    console.log("Teams populated successfully.");
}

// Fetch players based on selected team
async function fetchPlayers() {
    const team = document.getElementById("teamSelect").value;
    const playersDropdown = document.getElementById("playerSelect");
    
    playersDropdown.innerHTML = '<option value="">Select Player</option>'; // Reset players list
    
    if (!team) return;

    const players = await loadPlayers();
    const teamAbbr = reverseTeamMapping[team];
    const teamPlayers = players.filter(player => player.Team === teamAbbr)
                               .map(player => player.Player);

    teamPlayers.forEach(player => {
        let option = document.createElement("option");
        option.value = player;
        option.textContent = player;
        playersDropdown.appendChild(option);
    });
}

// Analyze bet function (Replaces Flask API)
async function analyzeBet() {
    const team = document.getElementById("teamSelect").value;
    const player = document.getElementById("playerSelect").value;
    const stat = document.getElementById("statSelect").value;
    const line = parseFloat(document.getElementById("betLine").value);
    const opponent = document.getElementById("opponentSelect").value;

    if (!team || !player || !stat || isNaN(line) || !opponent) {
        alert("Please fill all fields.");
        return;
    }

    const players = await loadPlayers();
    const teams = await loadTeams();
    
    const teamAbbr = reverseTeamMapping[team];
    const playerStats = players.find(p => p.Team === teamAbbr && p.Player === player);

    if (!playerStats) {
        alert("Invalid player selection.");
        return;
    }

    const playerAvg = playerStats[stat];

    const opponentDefense = teams.find(t => t.Team === opponent);
    if (!opponentDefense) {
        alert("Invalid opponent selection.");
        return;
    }

    const opponentDRtg = opponentDefense["DRtg"];
    const opponentEFG = opponentDefense["eFG%"];

    const leagueAvgDRtg = teams.reduce((sum, t) => sum + t["DRtg"], 0) / teams.length;
    const leagueAvgEFG = teams.reduce((sum, t) => sum + t["eFG%"], 0) / teams.length;

    let impact = "The opponent has an average defense.";
    if (opponentDRtg < leagueAvgDRtg && opponentEFG < leagueAvgEFG) {
        impact = "The opponent has a strong defense. Expect lower stats.";
    } else if (opponentDRtg > leagueAvgDRtg && opponentEFG > leagueAvgEFG) {
        impact = "The opponent has a weak defense. Expect better stats.";
    }

    let assessment = "Line is accurate.";
    if (line > playerAvg) {
        assessment = "Line is too high.";
    } else if (line < playerAvg) {
        assessment = "Line is too low.";
    }

    // Display results
    document.getElementById("result").innerHTML = `
        <p><strong>Player:</strong> ${player}</p>
        <p><strong>Stat:</strong> ${stat}</p>
        <p><strong>Average:</strong> ${playerAvg.toFixed(2)}</p>
        <p><strong>Assessment:</strong> ${assessment}</p>
        <p><strong>Impact:</strong> ${impact}</p>
    `;
}

// Initialize team dropdown and stat options on page load
document.addEventListener("DOMContentLoaded", () => {
    populateTeams();
    const statDropdown = document.getElementById("statSelect");
    ["PTS", "AST", "TRB", "BLK", "STL", "TOV", "FG%", "3P%", "FT%"].forEach(stat => {
        let option = document.createElement("option");
        option.value = stat;
        option.textContent = stat;
        statDropdown.appendChild(option);
    });
});
