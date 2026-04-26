let nav;
let nav_ul;
let nav_li;
let nav_button;
let nav_space;
let nav_divider;
let isNavOpen;
function changeNav(){
    isNavOpen = false;
    nav = document.querySelector('nav');
    nav_ul = document.querySelector('nav ul');
    nav_li = document.querySelectorAll('nav ul li');
    nav_button = document.querySelector('nav button');
    nav_space = document.querySelectorAll('.space');
    nav_divider = document.querySelectorAll('.divider');
    nav_button.addEventListener('click', () => {
        nav.classList.toggle("nav-open");
        nav_ul.classList.toggle("nav-ul-open");
        if (!isNavOpen) {
            nav_li.forEach(item => {
                item.style.display = 'flex';
            });
            nav_space.forEach(item => {
                item.style.display = 'none';
            });
            nav_divider.forEach(item => {
                item.style.display = 'block';
            });
            nav_button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" version="1.1" viewBox="0 0 264.58 264.58"> <rect x="-6.7529e-6" y="-6.7529e-6" width="264.58" height="264.58" fill="#ffffff" style="paint-order:stroke markers fill"/> <circle cx="132.29" cy="132.29" r="62.177" fill="none" stroke="#4d4d4d" stroke-width="7.9375" style="paint-order:stroke markers fill"/> <path d="m103.35 161.24 57.887-57.887m-57.887 0 57.887 57.887" fill="none" stroke="#0473e1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" stroke-width="7.9375"/> </svg>';
        } else {
            nav_li.forEach(item => {
                item.style.display = '';
            });
            nav_button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" version="1.1" viewBox="0 0 264.58 264.58"> <rect width="264.58" height="264.58" fill="#ffffff" style="paint-order:stroke markers fill"/> <rect x="72.76" y="83.344" width="119.06" height="97.896" rx="7.9375" ry="7.9375" fill="none" stroke="#4d4d4d" stroke-linecap="round" stroke-miterlimit="4" stroke-width="7.9375" style="paint-order:fill markers stroke"/> <g transform="translate(1.7529e-6 2.6458)" fill="#4d4d4d" stroke="#0573e1" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="4" stroke-width="7.9375"> <path d="m101.86 108.48h60.854" fill-opacity=".015686"/> <path d="m101.86 129.65h60.854"/> <path d="m101.86 150.81h60.854"/> </g> </svg>';
        }
        isNavOpen = !isNavOpen;
    });
}
typeof window.Turbo === "undefined" ? window.addEventListener('DOMContentLoaded', changeNav) : window.addEventListener('turbo:load', changeNav);