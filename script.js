let db;

// 1. Database Initialization
const request = indexedDB.open("MasjidPortalDB", 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("posts")) {
        db.createObjectStore("posts", { keyPath: "id" });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    loadMainPosts(); // Homepage posts load karein
};

request.onerror = (e) => console.error("Database Error:", e);

// 2. Modal Functions
function openAdminModal() { document.getElementById("admin-modal").style.display = "block"; }
function closeAdminModal() { 
    document.getElementById("admin-modal").style.display = "none";
    // Reset to login screen for next time
    document.getElementById("login-section").style.display = "block";
    document.getElementById("admin-panel").style.display = "none";
}
function openDonateModal() { document.getElementById("donate-modal").style.display = "block"; }
function closeDonateModal() { document.getElementById("donate-modal").style.display = "none"; }

// 3. Admin Login Logic
function verifyLogin() {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPass").value;

    if (email === "nasir@gmail.com" && pass === "nasir") {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("admin-panel").style.display = "block";
        loadManageList(); // Manage list load karein
    } else {
        alert("Ghalat Details! Sirf Nasir bhai login kar sakte hain.");
    }
}

// 4. Tab Switching (Add vs Remove)
function switchTab(tab) {
    const isAdd = tab === 'add';
    document.getElementById("add-post-tab").style.display = isAdd ? "block" : "none";
    document.getElementById("remove-post-tab").style.display = isAdd ? "none" : "block";
    
    document.getElementById("tab-add").classList.toggle("active", isAdd);
    document.getElementById("tab-remove").classList.toggle("active", !isAdd);
    
    if (!isAdd) loadManageList(); // Delete tab par image load hogi
}

// 5. Add Post (Image & Video)
function addPost() {
    const title = document.getElementById("postTitle").value;
    const desc = document.getElementById("postDesc").value;
    const fileInput = document.getElementById("postMedia");
    const file = fileInput.files[0];

    if (!title || !desc || !file) return alert("Bhai, sari fields bharna zaroori hain!");

    const reader = new FileReader();
    reader.onload = (e) => {
        const transaction = db.transaction(["posts"], "readwrite");
        const store = transaction.objectStore("posts");
        
        const newPost = {
            id: Date.now(),
            title: title,
            desc: desc,
            mediaData: e.target.result, // Base64 image/video data
            isVideo: file.type.startsWith('video'),
            date: new Date().toLocaleDateString('en-GB')
        };

        store.add(newPost).onsuccess = () => {
            alert("Mubarak ho! Post kamyabi se upload ho gayi.");
            location.reload(); 
        };
    };
    reader.readAsDataURL(file);
}

// 6. Homepage Grid Load
function loadMainPosts() {
    const photoGrid = document.getElementById("photos-grid");
    const videoGrid = document.getElementById("videos-grid");
    if (!db || !photoGrid || !videoGrid) return;

    db.transaction(["posts"], "readonly").objectStore("posts").getAll().onsuccess = (e) => {
        const posts = e.target.result.sort((a, b) => b.id - a.id);
        photoGrid.innerHTML = ""; videoGrid.innerHTML = "";

        posts.forEach(p => {
            const html = `
                <div class="post-card">
                    <small>📅 ${p.date}</small>
                    <h3>${p.title}</h3>
                    <p>${p.desc}</p>
                    ${p.isVideo ? `<video controls src="${p.mediaData}"></video>` : `<img src="${p.mediaData}">`}
                </div>`;
            p.isVideo ? videoGrid.innerHTML += html : photoGrid.innerHTML += html;
        });
    };
}

// 7. Manage List (WITH IMAGE THUMBNAIL)
function loadManageList() {
    const listContainer = document.getElementById("manage-posts-list");
    if (!db || !listContainer) return;

    db.transaction(["posts"], "readonly").objectStore("posts").getAll().onsuccess = (e) => {
        const posts = e.target.result.sort((a, b) => b.id - a.id);
        
        if (posts.length === 0) {
            listContainer.innerHTML = "<p style='padding:20px; text-align:center;'>Koi post nahi mili.</p>";
            return;
        }

        listContainer.innerHTML = posts.map(p => `
            <div class="manage-post-item" style="display:flex; align-items:center; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:50px; height:50px; border-radius:6px; overflow:hidden; background:#eee; flex-shrink:0;">
                        ${p.isVideo ? 
                            `<div style="width:100%; height:100%; background:#333; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px;">VIDEO</div>` : 
                            `<img src="${p.mediaData}" style="width:100%; height:100%; object-fit:cover;">`
                        }
                    </div>
                    <div style="text-align:left;">
                        <strong style="display:block; font-size:14px;">${p.title}</strong>
                        <small style="color:#777;">${p.date}</small>
                    </div>
                </div>
                <button onclick="deletePost(${p.id})" style="background:#e74c3c; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    };
}

// 8. Delete Post
function deletePost(id) {
    if (confirm("Kya aap waqai ye post delete karna chahte hain?")) {
        db.transaction(["posts"], "readwrite").objectStore("posts").delete(id).onsuccess = () => {
            loadManageList();
            loadMainPosts();
        };
    }
}

// 9. Update File Name UI
function updateFileName() {
    const fileInput = document.getElementById('postMedia');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (fileInput.files.length > 0) {
        fileNameDisplay.innerText = "Selected: " + fileInput.files[0].name;
        fileNameDisplay.style.color = "#145A32";
    }
}



function updateCurrentNamaz() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes; // Poore din ko minutes mein convert kiya

    // Namaz timings ko minutes mein set kiya (Sardion ke hisaab se)
    const times = {
        fajr: 6 * 60 + 5,      // 06:05 AM
        zohr: 13 * 60 + 30,    // 01:30 PM
        asr: 16 * 60 + 35,     // 04:35 PM
        maghrib: 17 * 60 + 58, // 05:58 PM
        isha: 20 * 60 + 0      // 08:00 PM
    };

    // Pehle purani saari highlights hatao
    document.querySelectorAll('.namaz-card').forEach(card => {
        card.classList.remove('current-namaz');
    });

    let activeId = "";

    // Logic: Agli namaz tak pichli namaz highlight rahegi
    if (currentTime >= times.fajr && currentTime < times.zohr) {
        activeId = "card-fajr";
    } else if (currentTime >= times.zohr && currentTime < times.asr) {
        activeId = "card-zohr";
    } else if (currentTime >= times.asr && currentTime < times.maghrib) {
        activeId = "card-asr";
    } else if (currentTime >= times.maghrib && currentTime < times.isha) {
        activeId = "card-maghrib";
    } else {
        activeId = "card-isha"; // Isha ke baad se Fajr tak Isha highlight
    }

    if(activeId) {
        document.getElementById(activeId).classList.add('current-namaz');
    }
}

// Har 1 minute baad check karega
setInterval(updateCurrentNamaz, 60000);
// Page load hote hi foran chalao
updateCurrentNamaz();