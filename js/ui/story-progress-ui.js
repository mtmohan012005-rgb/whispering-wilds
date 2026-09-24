// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY PROGRESS UI
// Cinematic chapter overview, objective tracking, evidence viewer, and replay UI.
// ============================================================================

(function() {
    class StoryProgressUI {
        constructor() {
            this.modalElement = null;
            this.isOpen = false;
        }

        init() {
            if (this.modalElement) return;

            const modal = document.createElement('div');
            modal.id = 'story-progress-modal';
            modal.className = 'progression-modal-overlay';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="codex-window" style="max-width: 960px;">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2 id="story-title">Main Investigation & Narrative</h2>
                            <span>The 7-Chapter Odyssey Across Tamil Nadu (காட்டு வழி)</span>
                        </div>
                        <button class="codex-close-btn" id="story-close-btn" aria-label="Close Story Journal">&times;</button>
                    </div>
                    <div style="display: flex; flex: 1; overflow: hidden;">
                        <div style="width: 280px; border-right: 1px solid rgba(212,175,55,0.2); overflow-y: auto; padding: 12px;" id="story-chapter-list">
                            <!-- Populated dynamically -->
                        </div>
                        <div style="flex: 1; overflow-y: auto; padding: 24px;" id="story-chapter-detail">
                            <!-- Chapter detail view -->
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.modalElement = modal;

            modal.querySelector('#story-close-btn').addEventListener('click', () => this.close());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        open() {
            this.init();
            this.renderChapters();
            this.modalElement.style.display = 'flex';
            this.isOpen = true;
        }

        close() {
            if (!this.modalElement) return;
            this.modalElement.style.display = 'none';
            this.isOpen = false;
        }

        renderChapters() {
            const listEl = this.modalElement.querySelector('#story-chapter-list');
            const detailEl = this.modalElement.querySelector('#story-chapter-detail');
            listEl.innerHTML = '';

            const sys = window.StoryContentSystem;
            if (!sys) {
                listEl.innerHTML = '<p style="color:#94a3b8; padding:12px;">Story system loading...</p>';
                return;
            }

            const chapters = sys.getChapters();
            const activeIdx = sys.activeChapterIndex;

            chapters.forEach((ch, idx) => {
                const item = document.createElement('div');
                item.className = `codex-nav-btn ${idx === activeIdx ? 'active' : ''}`;
                item.style.marginBottom = '8px';
                item.style.cursor = 'pointer';

                const statusBadge = ch.completed 
                    ? '<span style="color:#22c55e; font-size:11px; float:right;">DONE</span>' 
                    : (idx === activeIdx ? '<span style="color:#ffd700; font-size:11px; float:right;">ACTIVE</span>' : '<span style="color:#64748b; font-size:11px; float:right;">LOCKED</span>');

                item.innerHTML = `
                    <div style="font-weight:600; font-size:13px;">Ch. ${ch.number}: ${ch.title}</div>
                    <div style="font-size:11px; color:#94a3b8;">${ch.tamilTitle || ''} ${statusBadge}</div>
                `;

                item.addEventListener('click', () => {
                    listEl.querySelectorAll('.codex-nav-btn').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    this.renderDetail(ch);
                });

                listEl.appendChild(item);
            });

            if (chapters[activeIdx]) {
                this.renderDetail(chapters[activeIdx]);
            }
        }

        renderDetail(chapter) {
            const detailEl = this.modalElement.querySelector('#story-chapter-detail');
            if (!chapter) {
                detailEl.innerHTML = '<p style="color:#94a3b8;">No chapter selected.</p>';
                return;
            }

            let objectivesHtml = '';
            chapter.objectives.forEach(obj => {
                objectivesHtml += `
                    <li style="margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                        <span style="color:${obj.done ? '#22c55e' : '#64748b'}; font-size:16px;">${obj.done ? '&#10003;' : '&#9675;'}</span>
                        <span style="color:${obj.done ? '#94a3b8' : '#f8fafc'}; text-decoration:${obj.done ? 'line-through' : 'none'};">${obj.description}</span>
                    </li>
                `;
            });

            let optionalHtml = '';
            if (chapter.optionalObjectives && chapter.optionalObjectives.length > 0) {
                chapter.optionalObjectives.forEach(obj => {
                    optionalHtml += `
                        <li style="margin-bottom:6px; display:flex; align-items:center; gap:8px;">
                            <span style="color:${obj.done ? '#38bdf8' : '#475569'}; font-size:14px;">${obj.done ? '&#9670;' : '&#9671;'}</span>
                            <span style="color:${obj.done ? '#94a3b8' : '#cbd5e1'}; font-size:13px;">${obj.description} (Optional)</span>
                        </li>
                    `;
                });
            }

            let replayBtnHtml = '';
            if (window.GameState && window.GameState.story && window.GameState.story.storyCompleted) {
                replayBtnHtml = `
                    <button id="replay-btn-${chapter.id}" style="margin-top:16px; background:rgba(212,175,55,0.2); border:1px solid #ffd700; color:#ffd700; padding:6px 14px; border-radius:4px; cursor:pointer;">
                        Replay Chapter Scenario
                    </button>
                `;
            }

            detailEl.innerHTML = `
                <div style="border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 16px; margin-bottom: 16px;">
                    <div style="font-size:12px; color:#ffd700; text-transform:uppercase; letter-spacing:1.5px;">Chapter ${chapter.number} &bull; Region: ${chapter.region.replace('_', ' ').toUpperCase()}</div>
                    <h1 style="margin:4px 0 2px 0; font-size:22px; color:#f8fafc;">${chapter.title}</h1>
                    <h3 style="margin:0 0 12px 0; font-size:15px; color:#38bdf8; font-weight:normal;">${chapter.tamilTitle || ''}</h3>
                    <p style="color:#cbd5e1; line-height:1.6; font-size:14px;">${chapter.summary}</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="color:#ffd700; margin-bottom:10px; font-size:14px; text-transform:uppercase;">Primary Objectives</h4>
                    <ul style="list-style:none; padding-left:0; margin:0;">
                        ${objectivesHtml}
                    </ul>
                </div>

                ${optionalHtml ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color:#38bdf8; margin-bottom:10px; font-size:14px; text-transform:uppercase;">Secondary Inquiries</h4>
                    <ul style="list-style:none; padding-left:0; margin:0;">
                        ${optionalHtml}
                    </ul>
                </div>
                ` : ''}

                <div style="margin-top: 20px; padding: 12px 16px; background: rgba(0,0,0,0.3); border-radius: 6px; border-left: 3px solid #ffd700;">
                    <strong style="color:#ffd700; font-size:12px; text-transform:uppercase;">Investigation Lead / Evidence:</strong>
                    <div style="color:#e2e8f0; font-size:13px; margin-top:4px;">${chapter.primaryEvidence ? chapter.primaryEvidence.replace('clue_', '').replace('_', ' ').toUpperCase() : 'None documented'}</div>
                </div>

                ${replayBtnHtml}
            `;

            const btn = detailEl.querySelector(`#replay-btn-${chapter.id}`);
            if (btn && window.ReplaySystem) {
                btn.addEventListener('click', () => {
                    window.ReplaySystem.replayChapter(chapter.id);
                });
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.StoryProgressUI = new StoryProgressUI();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { StoryProgressUI };
    }
})();
