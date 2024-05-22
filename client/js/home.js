function showForm() {
    // Check if the user is logged in
    const loggedIn = '<%= loggedIn %>'; // Get the value of loggedIn from EJS
    if (loggedIn === 'false') {
        window.alert('Please log in to upload PDFs.');
        return; // Stop execution if the user is not logged in
    }

    document.getElementById("uploadForm").style.display = "block";
}

function hideForm() {
    document.getElementById("uploadForm").style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.likeIcon').forEach(likeIcon => {
        likeIcon.addEventListener('click', () => {
            const pdfId = likeIcon.parentElement.dataset.pdfId;
            const isLiked = likeIcon.src.includes('/img/liked.png');

            // Check if the user is logged in
            const loggedIn = '<%= loggedIn %>'; // Get the value of loggedIn from EJS
            if (loggedIn === 'false') {
                window.alert('Please log in to like this PDF.');
                return; // Stop execution if the user is not logged in
            }

            fetch(isLiked ? '/unlike' : '/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pdfId })
            })
            .then(response => response.text())
            .then(data => {
                if (isLiked) {
                    likeIcon.src = '/img/like.png';
                    const likeCountElem = likeIcon.nextElementSibling;
                    likeCountElem.textContent = parseInt(likeCountElem.textContent) - 1;
                } else {
                    likeIcon.src = '/img/liked.png';
                    const likeCountElem = likeIcon.nextElementSibling;
                    likeCountElem.textContent = parseInt(likeCountElem.textContent) + 1;
                }
            })
            .catch(error => console.error('Error:', error));
        });
    });

    document.querySelectorAll('.saveIcon').forEach(saveIcon => {
        saveIcon.addEventListener('click', () => {
            const pdfId = saveIcon.parentElement.dataset.pdfId;
            const isSaved = saveIcon.src.includes('/img/saved.png');

            // Check if the user is logged in
            const loggedIn = '<%= loggedIn %>'; // Get the value of loggedIn from EJS
            if (loggedIn === 'false') {
                window.alert('Please log in to save this PDF.');
                return; // Stop execution if the user is not logged in
            }

            fetch(isSaved ? '/unsave' : '/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pdfId })
            })
            .then(response => response.text())
            .then(data => {
                if (isSaved) {
                    saveIcon.src = '/img/save.png';
                } else {
                    saveIcon.src = '/img/saved.png';
                }
            })
            .catch(error => console.error('Error:', error));
        });
    });
});
