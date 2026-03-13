// Frontend functionality for Language Detection

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const textInput = document.getElementById('textInput');
    const modelSelect = document.getElementById('modelSelect');
    const detectBtn = document.getElementById('detectBtn');
    const resultsSection = document.getElementById('resultsSection');
    const detectedLang = document.getElementById('detectedLang');
    const modelUsed = document.getElementById('modelUsed');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceText = document.getElementById('confidenceText');
    const textPreview = document.getElementById('textPreview');
    const probBody = document.getElementById('probBody');
    
    // Sample texts for different languages
    const samples = {
        english: "The quick brown fox jumps over the lazy dog. This is a sample text in English language for testing purposes.",
        spanish: "El rápido zorro marrón salta sobre el perro perezoso. Este es un texto de ejemplo en español para pruebas.",
        french: "Le rapide renard brun saute par-dessus le chien paresseux. Ceci est un exemple de texte en français.",
        german: "Der schnelle braune Fuchs springt über den faulen Hund. Dies ist ein Beispieltext auf Deutsch.",
        italian: "La veloce volpe marrone salta sopra il cane pigro. Questo è un testo di esempio in italiano."
    };
    
    // Loading state
    function setLoading(isLoading) {
        if (isLoading) {
            detectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Detecting...';
            detectBtn.disabled = true;
        } else {
            detectBtn.innerHTML = '<i class="fas fa-search"></i> Detect Language';
            detectBtn.disabled = false;
        }
    }
    
    // Handle detect button click
    detectBtn.addEventListener('click', async function() {
        const text = textInput.value.trim();
        
        if (!text) {
            showAlert('Please enter some text to detect language', 'warning');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('/detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    model: modelSelect.value
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                displayResults(data);
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('An error occurred while detecting language', 'danger');
        } finally {
            setLoading(false);
        }
    });
    
    // Display results
    function displayResults(data) {
        // Update main result
        detectedLang.textContent = data.detected_language;
        modelUsed.textContent = data.model_used;
        
        // Update confidence
        const confidencePercent = Math.round(data.confidence * 100);
        confidenceBar.style.width = confidencePercent + '%';
        confidenceBar.setAttribute('aria-valuenow', confidencePercent);
        confidenceText.textContent = confidencePercent + '%';
        
        // Set color based on confidence
        if (confidencePercent >= 80) {
            confidenceBar.className = 'progress-bar bg-success';
        } else if (confidencePercent >= 60) {
            confidenceBar.className = 'progress-bar bg-info';
        } else {
            confidenceBar.className = 'progress-bar bg-warning';
        }
        
        // Update text preview
        textPreview.textContent = data.text;
        
        // Update probability table
        probBody.innerHTML = '';
        
        // Sort languages by probability
        const sortedLangs = Object.entries(data.probabilities)
            .sort((a, b) => b[1] - a[1]);
        
        sortedLangs.forEach(([lang, prob]) => {
            const probPercent = (prob * 100).toFixed(2);
            const row = document.createElement('tr');
            
            // Highlight the detected language
            if (lang === data.detected_language) {
                row.classList.add('table-success');
            }
            
            row.innerHTML = `
                <td>${lang}</td>
                <td>${probPercent}%</td>
                <td style="width: 40%;">
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${probPercent}%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
                             aria-valuenow="${probPercent}" aria-valuemin="0" aria-valuemax="100">
                        </div>
                    </div>
                </td>
            `;
            
            probBody.appendChild(row);
        });
        
        // Show results section
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Handle sample text buttons
    document.querySelectorAll('.sample-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.dataset.lang;
            if (samples[lang]) {
                textInput.value = samples[lang];
                
                // Highlight the selected sample
                document.querySelectorAll('.sample-btn').forEach(b => {
                    b.classList.remove('active', 'btn-primary');
                    b.classList.add('btn-outline-secondary');
                });
                
                this.classList.remove('btn-outline-secondary');
                this.classList.add('active', 'btn-primary');
            }
        });
    });
    
    // Show alert message
    function showAlert(message, type) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Insert alert before results section
        const mainCard = document.querySelector('.card-body');
        mainCard.insertBefore(alertDiv, resultsSection);
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
    
    // Handle enter key in textarea
    textInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            detectBtn.click();
        }
    });
    
    // Show tooltip for keyboard shortcut
    textInput.title = 'Press Ctrl+Enter to detect language';
});