#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取月份名称
function getMonthName(date) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[date.getMonth()];
}

// 检查文件是否在暂存区中（已修改准备提交）
function isFileStaged(filePath) {
    try {
        const command = `git diff --cached --name-only -- "${filePath}"`;
        const output = execSync(command, { encoding: 'utf-8', cwd: __dirname }).trim();
        return output.length > 0;
    } catch (error) {
        return false;
    }
}

// 获取文件的最后 git 提交时间
function getLastCommitDate(filePath) {
    // 如果文件在暂存区中（即将被提交），使用当前时间
    if (isFileStaged(filePath)) {
        return new Date();
    }
    
    try {
        const command = `git log -1 --format=%ci -- "${filePath}"`;
        const output = execSync(command, { encoding: 'utf-8', cwd: __dirname }).trim();
        
        if (!output) {
            // 如果文件没有被提交过，使用当前时间
            return new Date();
        }
        
        return new Date(output);
    } catch (error) {
        // 如果 git 命令失败，使用当前时间
        console.warn(`Warning: Could not get git date for ${filePath}, using current date`);
        return new Date();
    }
}

// 格式化日期为 "Month Day, Year" 格式
function formatDate(date) {
    const month = getMonthName(date);
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

// 更新 HTML 文件中的 last-updated
function updateLastUpdated(htmlFile) {
    const filePath = path.join(__dirname, htmlFile);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${htmlFile}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // 获取文件的最后提交时间
    const lastCommitDate = getLastCommitDate(htmlFile);
    const formattedDate = formatDate(lastCommitDate);
    
    // 替换 last-updated 内容
    const regex = /<p class="last-updated">Last Updated: [^<]+<\/p>/;
    const replacement = `<p class="last-updated">Last Updated: ${formattedDate}</p>`;
    
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${htmlFile}: ${formattedDate}`);
    } else {
        console.warn(`Could not find last-updated in ${htmlFile}`);
    }
}

// 获取所有 HTML 文件
const htmlFiles = [
    'index.html',
    'personal.html',
    'publications.html',
    'education.html',
    'service.html',
    'experience.html',
    'honors.html',
    'cv.html',
    'talks.html'
];

// 更新所有文件
console.log('Updating last-updated dates based on git commit times...\n');
htmlFiles.forEach(updateLastUpdated);
console.log('\nDone!');

