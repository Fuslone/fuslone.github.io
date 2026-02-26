let isMenuOpen = false;
const nav = document.querySelector('nav');
const ul = document.querySelector('ul');
const li = document.querySelectorAll('nav ul>li');
const a = document.querySelectorAll('nav a');
const menu = document.querySelector('.menu');
menu.addEventListener('click', () => {
    if (!isMenuOpen) {
        nav.style.position = 'fixed';
        nav.style.top = '0';
        nav.style.left = '0';
        nav.style.padding = '50px 0';
        nav.style.width = '100vw';
        nav.style.height = '100vh';
        nav.style.zIndex = '999';
        nav.style.backgroundColor = 'rgb(255, 255, 255)';
        ul.style.padding = '0';
        ul.style.height = '480px';
        ul.style.boxShadow = 'none';
        ul.style.flexDirection = 'column';
        li.forEach(item => {
            if (item.classList.contains("space-1") || item.classList.contains("space-2")) {
                item.style.display = 'none';
            } else {
                if (!item.classList.contains("divider")) {
                    item.style.display = 'flex';
                    item.style.margin = 'auto';
                    let link = item.querySelector('a');
                    if (link) {
                        link.style.margin = 'auto';
                    }
                } else {
                    item.style.display = 'block';
                }
            }
        });
        menu.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" version="1.1" viewBox="0 0 264.58 264.58"> <rect x="-6.7529e-6" y="-6.7529e-6" width="264.58" height="264.58" fill="#ffffff" style="paint-order:stroke markers fill"/> <circle cx="132.29" cy="132.29" r="62.177" fill="none" stroke="#4d4d4d" stroke-width="7.9375" style="paint-order:stroke markers fill"/> <path d="m103.35 161.24 57.887-57.887m-57.887 0 57.887 57.887" fill="none" stroke="#0473e1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" stroke-width="7.9375"/> </svg>';
    } else {
        nav.style.position = '';
        nav.style.top = '';
        nav.style.left = '';
        nav.style.padding = '';
        nav.style.width = '';
        nav.style.height = '';
        nav.style.zIndex = '';
        nav.style.backgroundColor = '';
        ul.style.padding = '';
        ul.style.height = '';
        ul.style.boxShadow = '';
        ul.style.flexDirection = '';
        li.forEach(item => {
            item.style.display = '';
            item.style.margin = '';
            let link = item.querySelector('a');
            if (link) {
                link.style.margin = '';
            }
        });
        menu.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" version="1.1" viewBox="0 0 264.58 264.58"> <rect width="264.58" height="264.58" fill="#ffffff" style="paint-order:stroke markers fill"/> <rect x="72.76" y="83.344" width="119.06" height="97.896" rx="7.9375" ry="7.9375" fill="none" stroke="#4d4d4d" stroke-linecap="round" stroke-miterlimit="4" stroke-width="7.9375" style="paint-order:fill markers stroke"/> <g transform="translate(1.7529e-6 2.6458)" fill="#4d4d4d" stroke="#0573e1" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="4" stroke-width="7.9375"> <path d="m101.86 108.48h60.854" fill-opacity=".015686"/> <path d="m101.86 129.65h60.854"/> <path d="m101.86 150.81h60.854"/> </g> </svg>';
    }
    isMenuOpen = !isMenuOpen;
});
