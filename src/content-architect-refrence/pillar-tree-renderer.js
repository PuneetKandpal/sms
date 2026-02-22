// Pillar Tree Renderer - Dynamically generates the pillar tree HTML

function renderPillarTree() {
    const container = document.querySelector('.pillar-tree');
    if (!container || !pillarTreeData) return;
    
    container.innerHTML = '';
    
    pillarTreeData.pillars.forEach(pillar => {
        const pillarEl = createPillarElement(pillar);
        container.appendChild(pillarEl);
    });
}

function createPillarElement(pillar) {
    const div = document.createElement('div');
    div.className = 'pillar';
    
    const expandedClass = pillar.expanded ? 'expanded' : '';
    const hiddenClass = pillar.expanded ? '' : 'hidden';
    
    div.innerHTML = `
        <div class="pillar-header ${pillar.id}" onclick="handlePillarClick('${pillar.id}')">
            <div class="pillar-title">
                <span class="icon-toggle">
                    <span class="chevron-icon ${expandedClass}">
                        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="6,5 10,8 6,11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span class="doc-icon">
                        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                            <path d="M10 2v3h3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                        </svg>
                    </span>
                </span>
                <span class="item-name">${pillar.name}</span>
            </div>
        </div>
        <div id="${pillar.id}-content" class="${hiddenClass}">
            ${pillar.nodes ? pillar.nodes.map(node => createNodeHTML(node)).join('') : ''}
        </div>
    `;
    
    return div;
}

function createNodeHTML(node) {
    const expandedClass = node.expanded ? 'expanded' : '';
    const hiddenClass = node.expanded ? '' : 'hidden';
    
    return `
        <div class="node">
            <div class="node-header" onclick="handleNodeClick('${node.id}')">
                <div class="node-title">
                    <span class="icon-toggle">
                        <span class="chevron-icon ${expandedClass}">
                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="6,5 10,8 6,11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        <span class="doc-icon">
                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                                <path d="M10 2v3h3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                            </svg>
                        </span>
                    </span>
                    <span class="item-name">${node.name}</span>
                </div>
            </div>
            <div id="${node.id}-content" class="${hiddenClass}">
                ${node.subNodes ? node.subNodes.map(subNode => createSubNodeHTML(subNode)).join('') : ''}
            </div>
        </div>
    `;
}

function createSubNodeHTML(subNode) {
    const expandedClass = subNode.expanded ? 'expanded' : '';
    const hiddenClass = subNode.expanded ? '' : 'hidden';
    
    return `
        <div class="sub-node">
            <div class="sub-node-header" onclick="handleSubNodeClick('${subNode.id}')">
                <div class="sub-node-title">
                    <span class="icon-toggle">
                        <span class="chevron-icon ${expandedClass}">
                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="6,5 10,8 6,11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        <span class="doc-icon">
                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                                <path d="M10 2v3h3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                            </svg>
                        </span>
                    </span>
                    <span class="item-name">${subNode.name}</span>
                </div>
            </div>
            <div id="${subNode.id}-content" class="${hiddenClass}">
                ${subNode.content ? subNode.content.map(content => createContentHTML(content)).join('') : ''}
            </div>
        </div>
    `;
}

function createContentHTML(content) {
    const statusClass = `status-${content.status}`;
    
    return `
        <div class="content-item" onclick="selectContent('${content.id}')">
            <span>
                <span class="content-icon">
                    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                        <path d="M10 2v3h3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                </span>
                ${content.title}
            </span>
            <span class="status-badge ${statusClass}">${content.status.charAt(0).toUpperCase() + content.status.slice(1)}</span>
        </div>
    `;
}

// Unified click handlers - both toggle and select
function handlePillarClick(pillarId) {
    // Toggle expansion
    const content = document.getElementById(`${pillarId}-content`);
    const header = event.target.closest('.pillar-header');
    const icon = header.querySelector('.chevron-icon');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.add('expanded');
    } else {
        content.classList.add('hidden');
        icon.classList.remove('expanded');
    }
    
    // Select the pillar
    selectPillar(pillarId);
}

function selectPillar(pillarId) {
    // Remove selection from all items
    document.querySelectorAll('.pillar-header, .node-header, .sub-node-header, .content-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked pillar
    const pillarHeader = document.querySelector(`.pillar-header.${pillarId}`);
    if (pillarHeader) {
        pillarHeader.classList.add('selected');
    }
    
    // Handle pillar selection (load details, etc.)
    console.log('Pillar selected:', pillarId);
    // Add your selection logic here
}

function handleNodeClick(nodeId) {
    // Toggle expansion
    const content = document.getElementById(`${nodeId}-content`);
    const header = event.target.closest('.node-header');
    const icon = header.querySelector('.chevron-icon');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.add('expanded');
    } else {
        content.classList.add('hidden');
        icon.classList.remove('expanded');
    }
    
    // Select the node
    selectNode(nodeId);
}

function selectNode(nodeId) {
    // Remove selection from all items
    document.querySelectorAll('.pillar-header, .node-header, .sub-node-header, .content-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked node
    const nodeHeader = document.querySelector(`.node-header[onclick*="${nodeId}"]`);
    if (nodeHeader) {
        nodeHeader.classList.add('selected');
    }
    
    // Handle node selection
    console.log('Node selected:', nodeId);
    // Add your selection logic here
}

function handleSubNodeClick(subNodeId) {
    // Toggle expansion
    const content = document.getElementById(`${subNodeId}-content`);
    const header = event.target.closest('.sub-node-header');
    const icon = header.querySelector('.chevron-icon');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.add('expanded');
    } else {
        content.classList.add('hidden');
        icon.classList.remove('expanded');
    }
    
    // Select the sub-node
    selectSubNode(subNodeId);
}

function selectSubNode(subNodeId) {
    // Remove selection from all items
    document.querySelectorAll('.pillar-header, .node-header, .sub-node-header, .content-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked sub-node
    const subNodeHeader = document.querySelector(`.sub-node-header[onclick*="${subNodeId}"]`);
    if (subNodeHeader) {
        subNodeHeader.classList.add('selected');
    }
    
    // Handle sub-node selection
    console.log('Sub-node selected:', subNodeId);
    // Add your selection logic here
}

function selectContent(contentId) {
    // Remove selection from all items
    document.querySelectorAll('.pillar-header, .node-header, .sub-node-header, .content-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    event.target.closest('.content-item').classList.add('selected');
    
    // Load detail panel content
    loadDetailPanel();
}

// Expand/Collapse All functionality
function toggleExpandCollapseAll() {
    const btn = document.querySelector('.expand-collapse-btn');
    const allContent = document.querySelectorAll('[id$="-content"]');
    const allChevrons = document.querySelectorAll('.chevron-icon');
    
    // Check if currently collapsed (button has 'collapsed' class means tree is collapsed)
    const isCollapsed = btn.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expand all
        allContent.forEach(content => content.classList.remove('hidden'));
        allChevrons.forEach(chevron => chevron.classList.add('expanded'));
        btn.classList.remove('collapsed');
        btn.title = 'Collapse All';
    } else {
        // Collapse all
        allContent.forEach(content => content.classList.add('hidden'));
        allChevrons.forEach(chevron => chevron.classList.remove('expanded'));
        btn.classList.add('collapsed');
        btn.title = 'Expand All';
    }
}

// Detail Panel Renderer
function loadDetailPanel(tabName = 'overview') {
    const detailPanel = document.querySelector('.tab-content');
    if (!detailPanel || !detailPanelData) return;
    
    let content = '';
    
    switch(tabName) {
        case 'overview':
            content = renderOverviewTab();
            break;
        case 'seo':
            content = renderSEOTab();
            break;
        case 'links':
            content = renderLinksTab();
            break;
        case 'content':
            content = renderContentTab();
            break;
        case 'promote':
            content = renderPromoteTab();
            break;
        case 'analytics':
            content = renderAnalyticsTab();
            break;
    }
    
    detailPanel.innerHTML = content;
}

function renderOverviewTab() {
    const data = detailPanelData.content;
    const publishingData = detailPanelData.publishing;
    return `
        <div style="display: flex; align-items: center; gap: 2rem; padding: 1rem; background: #2c2c2c; border-radius: 0.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.875rem; color: #a1a1aa;">Status:</span>
                <span style="font-size: 0.875rem; font-weight: 600; color: #22c55e;">${publishingData.status}</span>
                ${publishingData.status === 'Published' ? `<span style="font-size: 0.875rem; color: #a1a1aa;">(${publishingData.publicationDate})</span>` : ''}
            </div>
            ${publishingData.status === 'Published' ? `
                <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.875rem; color: #a1a1aa;">URL:</span>
                    <a href="${publishingData.url}" target="_blank" style="font-size: 0.875rem; color: #0ea5e9; text-decoration: none; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${publishingData.url}</a>
                    <button style="background: none; border: none; cursor: pointer; padding: 0.25rem; display: flex; align-items: center;" title="Edit URL">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.99967 14L2.66634 10.6667L11.333 2.00004Z" stroke="#a1a1aa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            ` : ''}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div class="overview-left-column">
                <div class="form-group">
                    <label class="form-label">Content Title</label>
                    <input type="text" class="form-input" value="${data.contentTitle}" placeholder="Enter content title">
                </div>
                <div class="form-group">
                    <label class="form-label">Content Brief</label>
                    <textarea class="form-textarea" placeholder="Describe the content purpose and key messages">${data.description}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Page Template</label>
                    <select class="form-select">
                        <option ${data.pageTemplate === 'SR-PH: Pillar Hub' ? 'selected' : ''}>SR-PH: Pillar Hub</option>
                        <option ${data.pageTemplate === 'SR-TH: Clustered Topic Hub' ? 'selected' : ''}>SR-TH: Clustered Topic Hub</option>
                        <option ${data.pageTemplate === 'SR-PL: Pathway Lesson' ? 'selected' : ''}>SR-PL: Pathway Lesson</option>
                        <option ${data.pageTemplate === 'SR-TK: JTBD Task Page' ? 'selected' : ''}>SR-TK: JTBD Task Page</option>
                        <option ${data.pageTemplate === 'SR-CP: Comparison Page' ? 'selected' : ''}>SR-CP: Comparison Page</option>
                        <option ${data.pageTemplate === 'SR-CS: Case Study' ? 'selected' : ''}>SR-CS: Case Study</option>
                        <option ${data.pageTemplate === 'SR-PR: Pricing/Offer Page' ? 'selected' : ''}>SR-PR: Pricing/Offer Page</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Target Audience</label>
                    <input type="text" class="form-input" value="${data.targetAudience}" placeholder="Define target audience">
                </div>
                <div class="form-group">
                    <label class="form-label">Word Count</label>
                    <input type="number" class="form-input" value="${data.wordCount}">
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary">Save Changes</button>
                    <button class="btn btn-primary">Generate Article</button>
                </div>
            </div>
            <div class="overview-right-column">
                <h3 style="font-size: 1rem; font-weight: 600; color: #fafafa; margin-bottom: 1rem;">Audience & Voice</h3>
                <div class="audience-tiles">
                    <div class="audience-tile">
                        <div class="tile-header">
                            <span class="tile-title">Buyer persona</span>
                            <span class="tile-status loaded">📊 Loaded</span>
                        </div>
                        <p class="tile-content">Landlords and property managers managing small to medium-sized rental portfolios seek tools that provide early insights into tenant...</p>
                    </div>
                    <div class="audience-tile">
                        <div class="tile-header">
                            <span class="tile-title">Target market</span>
                            <span class="tile-status loaded">📊 Loaded</span>
                        </div>
                        <p class="tile-content">The target market comprises landlords and property owners managing their own rentals, particularly those with up to 10...</p>
                    </div>
                    <div class="audience-tile">
                        <div class="tile-header">
                            <span class="tile-title">Differentiators</span>
                            <span class="tile-status loaded">📊 Loaded</span>
                        </div>
                        <p class="tile-content">Shuk's key differentiator is its Lease Indication Tool (LIT), which provides early warnings of tenant renewal intentions, enabling...</p>
                    </div>
                    <div class="audience-tile">
                        <div class="tile-header">
                            <span class="tile-title">Brand Voice</span>
                            <span class="tile-status loaded">📊 Loaded</span>
                        </div>
                        <p class="tile-content">Shuk's brand voice is practical, empowering, and landlord-centric, emphasizing its deep understanding of property management challenges. It communicates...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSEOTab() {
    const data = detailPanelData.seo;
    return `
        <div class="form-group">
            <label class="form-label">Primary Keyword</label>
            <input type="text" class="form-input" value="${data.primaryKeyword}" placeholder="Main target keyword">
            <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #a1a1aa;">${data.primaryKeyword}</div>
        </div>
        <div class="form-group">
            <label class="form-label">Secondary Keywords</label>
            <input type="text" class="form-input" placeholder="add secondary keywords (comma separated)">
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${data.secondaryKeywords.map(kw => `<span style="background: #3f3f46; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">${kw}</span>`).join('')}
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Meta Title</label>
            <input type="text" class="form-input" value="${data.metaTitle}" placeholder="SEO optimized title">
        </div>
        <div class="form-group">
            <label class="form-label">Meta Description</label>
            <textarea class="form-textarea" placeholder="SEO meta description">${data.metaDescription}</textarea>
        </div>
        <div class="action-buttons">
            <button class="btn btn-primary">Update SEO</button>
            <button class="btn btn-secondary">Check Conflicts</button>
        </div>
    `;
}

function renderLinksTab() {
    const data = detailPanelData.links;
    return `
        <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 1rem; font-weight: 600; color: #e4e4e7; margin-bottom: 1rem;">Internal Text Links</h3>
            <table style="width: 100%; border-collapse: collapse; background: #2c2c2c; border-radius: 0.25rem; overflow: hidden;">
                <thead>
                    <tr style="background: #1e1e1e; border-bottom: 1px solid #3f3f46;">
                        <th style="padding: 0.75rem; text-align: left; font-size: 0.875rem; font-weight: 600; color: #a1a1aa;">Link Text</th>
                        <th style="padding: 0.75rem; text-align: left; font-size: 0.875rem; font-weight: 600; color: #a1a1aa;">URL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #3f3f46;">
                        <td style="padding: 0.75rem; color: #e4e4e7; font-size: 0.875rem;">market research best practices</td>
                        <td style="padding: 0.75rem; color: #0ea5e9; font-size: 0.875rem;">/discover/market-research-methods</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #3f3f46;">
                        <td style="padding: 0.75rem; color: #e4e4e7; font-size: 0.875rem;">customer interview guide</td>
                        <td style="padding: 0.75rem; color: #0ea5e9; font-size: 0.875rem;">/discover/customer-interviews</td>
                    </tr>
                    <tr>
                        <td style="padding: 0.75rem; color: #e4e4e7; font-size: 0.875rem;">educational resources</td>
                        <td style="padding: 0.75rem; color: #0ea5e9; font-size: 0.875rem;">/discover/educational-foundation</td>
                    </tr>
                </tbody>
            </table>
            <button class="btn btn-primary" style="margin-top: 0.75rem;">+ Add Text Link</button>
        </div>
        <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 1rem; font-weight: 600; color: #e4e4e7; margin-bottom: 1rem;">Internal Content Links</h3>
            ${data.internal.map(link => `
                <div style="background: #2c2c2c; padding: 1rem; border-radius: 0.25rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div><strong style="color: #0ea5e9;">${link.type}:</strong> ${link.title}</div>
                        <div style="font-size: 0.75rem; color: #a1a1aa; margin-top: 0.25rem;">${link.note}</div>
                    </div>
                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem;">Edit</button>
                </div>
            `).join('')}
            <button class="btn btn-primary" style="margin-top: 0.5rem;">+ Add Content Link</button>
        </div>
    `;
}

function renderGenerationTab() {
    const data = detailPanelData.generation;
    return `
        <div class="form-group">
            <label class="form-label">Content Generation Agent</label>
            <select class="form-select">
                <option ${data.agent === 'Blog Writer Agent' ? 'selected' : ''}>Blog Writer Agent</option>
                <option ${data.agent === 'Technical Writer Agent' ? 'selected' : ''}>Technical Writer Agent</option>
                <option ${data.agent === 'Video Script Agent' ? 'selected' : ''}>Video Script Agent</option>
                <option ${data.agent === 'Social Media Agent' ? 'selected' : ''}>Social Media Agent</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Content Brief</label>
            <textarea class="form-textarea" style="min-height: 120px;" placeholder="Describe what content to generate">${data.contentBrief}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Brand Guidelines</label>
            <textarea class="form-textarea" style="min-height: 120px;" placeholder="Specify tone, style, and brand requirements">${data.brandGuidelines}</textarea>
        </div>
        <div class="action-buttons">
            <button class="btn btn-primary">Generate Article</button>
        </div>
    `;
}

function renderContentTab() {
    return `
        <div style="display: flex; flex-direction: column; height: calc(100vh - 200px);">
            <div style="flex: 1; overflow-y: auto; background: #ffffff; color: #1e1e1e; padding: 2rem; border-radius: 0.25rem; margin-bottom: 1rem;">
                <h1 style="font-size: 2rem; font-weight: 700; color: #1e1e1e; margin-bottom: 1rem;">Complete Guide to Market Research Methods</h1>
                
                <p style="color: #64748b; margin-bottom: 2rem; font-size: 1.125rem;">Learn proven market research methods to identify customer problems and validate product ideas. Complete guide with templates and examples.</p>
                
                <h2 style="font-size: 1.5rem; font-weight: 600; color: #1e1e1e; margin-top: 2rem; margin-bottom: 1rem;">Introduction</h2>
                <p style="line-height: 1.75; margin-bottom: 1rem;">Market research is the foundation of successful product development and business strategy. Understanding your customers' needs, pain points, and behaviors allows you to create solutions that truly resonate with your target audience.</p>
                
                <p style="line-height: 1.75; margin-bottom: 1rem;">In this comprehensive guide, we'll explore the most effective market research methodologies used by leading companies to identify customer problems and validate their product ideas before investing significant resources.</p>
                
                <h2 style="font-size: 1.5rem; font-weight: 600; color: #1e1e1e; margin-top: 2rem; margin-bottom: 1rem;">Why Market Research Matters</h2>
                <p style="line-height: 1.75; margin-bottom: 1rem;">Before diving into specific methods, it's crucial to understand why market research is essential:</p>
                
                <ul style="margin-left: 1.5rem; margin-bottom: 1rem; line-height: 1.75;">
                    <li style="margin-bottom: 0.5rem;"><strong>Reduce Risk:</strong> Validate assumptions before building expensive solutions</li>
                    <li style="margin-bottom: 0.5rem;"><strong>Identify Opportunities:</strong> Discover unmet needs in the market</li>
                    <li style="margin-bottom: 0.5rem;"><strong>Understand Competition:</strong> Learn what alternatives customers currently use</li>
                    <li style="margin-bottom: 0.5rem;"><strong>Improve Product-Market Fit:</strong> Align your solution with real customer needs</li>
                </ul>
                
                <h2 style="font-size: 1.5rem; font-weight: 600; color: #1e1e1e; margin-top: 2rem; margin-bottom: 1rem;">Top Market Research Methods</h2>
                
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #1e1e1e; margin-top: 1.5rem; margin-bottom: 0.75rem;">1. Customer Interviews</h3>
                <p style="line-height: 1.75; margin-bottom: 1rem;">One-on-one conversations with potential or existing customers provide deep insights into their challenges, workflows, and decision-making processes. The key is to ask open-ended questions and listen more than you talk.</p>
                
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #1e1e1e; margin-top: 1.5rem; margin-bottom: 0.75rem;">2. Surveys and Questionnaires</h3>
                <p style="line-height: 1.75; margin-bottom: 1rem;">Surveys allow you to gather quantitative data from a larger sample size. Use them to validate hypotheses generated from qualitative research and identify patterns across your target market.</p>
                
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #1e1e1e; margin-top: 1.5rem; margin-bottom: 0.75rem;">3. Competitive Analysis</h3>
                <p style="line-height: 1.75; margin-bottom: 1rem;">Study your competitors and alternative solutions to understand what's already available in the market. This helps you identify gaps and differentiation opportunities.</p>
                
                <h2 style="font-size: 1.5rem; font-weight: 600; color: #1e1e1e; margin-top: 2rem; margin-bottom: 1rem;">Best Practices</h2>
                <p style="line-height: 1.75; margin-bottom: 1rem;">To get the most value from your market research:</p>
                
                <ul style="margin-left: 1.5rem; margin-bottom: 1rem; line-height: 1.75;">
                    <li style="margin-bottom: 0.5rem;">Start with qualitative research to understand the "why" behind customer behavior</li>
                    <li style="margin-bottom: 0.5rem;">Use quantitative methods to validate and scale your findings</li>
                    <li style="margin-bottom: 0.5rem;">Talk to customers regularly, not just during the research phase</li>
                    <li style="margin-bottom: 0.5rem;">Document and share insights across your organization</li>
                </ul>
                
                <h2 style="font-size: 1.5rem; font-weight: 600; color: #1e1e1e; margin-top: 2rem; margin-bottom: 1rem;">Conclusion</h2>
                <p style="line-height: 1.75; margin-bottom: 1rem;">Effective market research is an ongoing process, not a one-time activity. By consistently gathering and acting on customer insights, you'll build products that truly solve real problems and create lasting value for your customers.</p>
            </div>
            
            <div style="display: flex; gap: 1rem; padding: 1rem 0;">
                <button class="btn btn-secondary">Copy Markdown</button>
                <button class="btn btn-secondary">Copy HTML</button>
                <button class="btn btn-primary">Publish</button>
            </div>
        </div>
    `;
}

function renderPromoteTab() {
    return `
        <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 1.25rem; font-weight: 600; color: #e4e4e7; margin-bottom: 0.5rem;">Promote on Social Media</h3>
            <p style="font-size: 0.875rem; color: #a1a1aa; line-height: 1.5; margin-bottom: 2rem;">
                All of the content's information will be sent to the social media post agent to craft a custom post tailored to the specific channel, including an engaging image.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: #2c2c2c; border-radius: 0.5rem; padding: 1.5rem;">
                    <div style="font-size: 0.875rem; font-weight: 600; color: #e4e4e7; margin-bottom: 1rem;">Supported Platforms</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                        <div style="background: #1e1e1e; padding: 0.75rem 1rem; border-radius: 0.375rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="width: 10px; height: 10px; background: #1DA1F2; border-radius: 50%;"></span>
                            <span style="font-size: 0.875rem; color: #e4e4e7;">X (Twitter)</span>
                        </div>
                        <div style="background: #1e1e1e; padding: 0.75rem 1rem; border-radius: 0.375rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="width: 10px; height: 10px; background: #0A66C2; border-radius: 50%;"></span>
                            <span style="font-size: 0.875rem; color: #e4e4e7;">LinkedIn</span>
                        </div>
                        <div style="background: #1e1e1e; padding: 0.75rem 1rem; border-radius: 0.375rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="width: 10px; height: 10px; background: #FF4500; border-radius: 50%;"></span>
                            <span style="font-size: 0.875rem; color: #e4e4e7;">Reddit</span>
                        </div>
                        <div style="background: #1e1e1e; padding: 0.75rem 1rem; border-radius: 0.375rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="width: 10px; height: 10px; background: #1877F2; border-radius: 50%;"></span>
                            <span style="font-size: 0.875rem; color: #e4e4e7;">Facebook</span>
                        </div>
                        <div style="background: #1e1e1e; padding: 0.75rem 1rem; border-radius: 0.375rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="width: 10px; height: 10px; background: #000000; border: 1px solid #a1a1aa; border-radius: 50%;"></span>
                            <span style="font-size: 0.875rem; color: #e4e4e7;">TikTok</span>
                        </div>
                        <div style="background: #1e1e1e; padding: 0.75rem 1rem; border-radius: 0.375rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="width: 10px; height: 10px; background: linear-gradient(45deg, #F58529, #DD2A7B, #8134AF); border-radius: 50%;"></span>
                            <span style="font-size: 0.875rem; color: #e4e4e7;">Instagram</span>
                        </div>
                        <div style="background: #1e1e1e; padding: 0.75rem 1rem; border-radius: 0.375rem; display: flex; align-items: center; gap: 0.75rem;">
                            <span style="width: 10px; height: 10px; background: #FF0000; border-radius: 50%;"></span>
                            <span style="font-size: 0.875rem; color: #e4e4e7;">YouTube</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #2c2c2c; border-radius: 0.5rem; padding: 1.5rem;">
                    <div style="font-size: 0.875rem; font-weight: 600; color: #e4e4e7; margin-bottom: 1rem;">What the Agent Will Create</div>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem;">
                        <li style="display: flex; align-items: start; gap: 0.75rem;">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0; margin-top: 0.125rem;">
                                <circle cx="10" cy="10" r="10" fill="#22c55e" opacity="0.2"/>
                                <path d="M6 10l2.5 2.5L14 7" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div>
                                <div style="font-size: 0.875rem; color: #e4e4e7; font-weight: 500;">Brand-Aligned Content</div>
                                <div style="font-size: 0.8125rem; color: #a1a1aa; margin-top: 0.25rem;">Uses company information about customers, target markets, product benefits, and the article being promoted, including brand voice, to create authentic and useful content promotion</div>
                            </div>
                        </li>
                        <li style="display: flex; align-items: start; gap: 0.75rem;">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0; margin-top: 0.125rem;">
                                <circle cx="10" cy="10" r="10" fill="#22c55e" opacity="0.2"/>
                                <path d="M6 10l2.5 2.5L14 7" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div>
                                <div style="font-size: 0.875rem; color: #e4e4e7; font-weight: 500;">Platform-Optimized Copy</div>
                                <div style="font-size: 0.8125rem; color: #a1a1aa; margin-top: 0.25rem;">Tailored messaging for each platform's audience and character limits</div>
                            </div>
                        </li>
                        <li style="display: flex; align-items: start; gap: 0.75rem;">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0; margin-top: 0.125rem;">
                                <circle cx="10" cy="10" r="10" fill="#22c55e" opacity="0.2"/>
                                <path d="M6 10l2.5 2.5L14 7" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div>
                                <div style="font-size: 0.875rem; color: #e4e4e7; font-weight: 500;">Engaging Visual Content</div>
                                <div style="font-size: 0.8125rem; color: #a1a1aa; margin-top: 0.25rem;">AI-generated images designed to capture attention and drive engagement</div>
                            </div>
                        </li>
                        <li style="display: flex; align-items: start; gap: 0.75rem;">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0; margin-top: 0.125rem;">
                                <circle cx="10" cy="10" r="10" fill="#22c55e" opacity="0.2"/>
                                <path d="M6 10l2.5 2.5L14 7" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div>
                                <div style="font-size: 0.875rem; color: #e4e4e7; font-weight: 500;">Call-to-Action</div>
                                <div style="font-size: 0.8125rem; color: #a1a1aa; margin-top: 0.25rem;">Clear CTAs that drive traffic back to your content</div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            
        </div>
        
        <div style="display: flex; align-items: stretch; gap: 1.5rem;">
            <button class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1rem; font-weight: 600; min-width: 200px; box-shadow: 0 4px 6px rgba(14, 165, 233, 0.3); transition: all 0.2s;">Send to Post Agent</button>
            <div style="flex: 1; background: #1e3a5f; border-left: 3px solid #0ea5e9; padding: 1rem 1.25rem; border-radius: 0.375rem; display: flex; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0;">
                        <circle cx="10" cy="10" r="9" stroke="#0ea5e9" stroke-width="2"/>
                        <path d="M10 6v4M10 14h.01" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <div style="font-size: 0.8125rem; color: #bfdbfe; line-height: 1.5;">
                        <strong style="color: #e4e4e7;">Note:</strong> The agent will generate draft posts for your review. You can edit and approve each post before it's scheduled or published.
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAnalyticsTab() {
    const data = detailPanelData.analytics;
    return `
        <div style="margin-bottom: 2rem;">
            <div style="font-size: 1rem; font-weight: 600; color: #e4e4e7; margin-bottom: 1rem;">Performance Metrics (Last 30 Days)</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${data.pageViews}</div>
                    <div style="color: #64748b;">Page Views</div>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 2rem; font-weight: bold; color: #059669;">${data.conversionRate}</div>
                    <div style="color: #64748b;">Conversion Rate</div>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 2rem; font-weight: bold; color: #dc2626;">${data.avgTime}</div>
                    <div style="color: #64748b;">Avg. Time on Page</div>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 2rem; font-weight: bold; color: #7c3aed;">${data.keywordRanking}</div>
                    <div style="color: #64748b;">Keyword Ranking</div>
                </div>
            </div>
        </div>
        <div style="margin-bottom: 2rem;">
            <div style="font-size: 1rem; font-weight: 600; color: #e4e4e7; margin-bottom: 1rem;">SEO Performance</div>
            <div style="background: #2c2c2c; padding: 1rem; border-radius: 0.25rem;">
                ${data.seoPerformance.map(item => `
                    <div style="padding: 0.5rem 0; border-bottom: 1px solid #3f3f46;">${item.keyword} - Position ${item.position}</div>
                `).join('')}
            </div>
        </div>
        <div>
            <div style="font-size: 1rem; font-weight: 600; color: #e4e4e7; margin-bottom: 1rem;">Optimization Recommendations</div>
            <ul style="list-style: disc; padding-left: 1.5rem; color: #e4e4e7;">
                ${data.recommendations.map(rec => `<li style="margin-bottom: 0.5rem;">${rec}</li>`).join('')}
            </ul>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    renderPillarTree();
    loadDetailPanel('overview');
});
