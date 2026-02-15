let allPredictions = [];

async function loadPredictions() {
    try {
        const response = await fetch('predictions.json');
        if (!response.ok) throw new Error('Failed to load predictions');
        const data = await response.json();

        allPredictions = data.predictions;

        // Show metadata
        const date = new Date(data.generated_at);
        document.getElementById('updated').textContent =
            'Updated: ' + date.toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

        filterAndRender(10);
    } catch (err) {
        document.getElementById('predictions').innerHTML =
            '<div class="loading">Unable to load predictions. Please try again later.</div>';
    }
}

function filterAndRender(count) {
    const filtered = count === 'all'
        ? allPredictions
        : allPredictions.slice(0, count);

    document.getElementById('count').textContent =
        'Showing ' + filtered.length + ' of ' + allPredictions.length;

    renderCards(filtered);
}

function getProbClass(prob) {
    if (prob >= 80) return 'prob-high';
    if (prob >= 70) return 'prob-medium';
    return 'prob-low';
}

function renderCards(predictions) {
    const container = document.getElementById('predictions');

    if (predictions.length === 0) {
        container.innerHTML = '<div class="loading">No predictions available.</div>';
        return;
    }

    container.innerHTML = predictions.map(p => `
        <div class="card">
            <div class="prob-badge ${getProbClass(p.win_probability)}">
                ${p.win_probability}%
            </div>
            <div class="match-info">
                <div class="league-name">${p.country} &middot; ${p.league}</div>
                <div class="teams">${p.home_team} vs ${p.away_team}</div>
                <div class="prediction-pick">
                    Pick: <strong>${p.predicted_winner}</strong>
                    <span class="side">(${p.predicted_side})</span>
                </div>
                <div class="match-details">
                    <span>Form: ${p.winner_form}</span>
                    <span>vs ${p.opponent_form}</span>
                </div>
            </div>
            <div class="card-right">
                <div>
                    <div class="kickoff">${p.kickoff_utc} UTC</div>
                    <div class="kickoff-label">Kickoff</div>
                </div>
                <span class="match-type-badge ${p.verified ? 'badge-verified' : 'badge-league'}">
                    ${p.verified ? 'Verified' : 'League Match'}
                </span>
            </div>
        </div>
    `).join('');
}

// Filter button handlers
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const count = btn.dataset.count;
        filterAndRender(count === 'all' ? 'all' : parseInt(count));
    });
});

// Load on page ready
loadPredictions();
