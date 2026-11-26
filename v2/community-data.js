(function (root) {
  'use strict';
  const app=root.DanV2;
  const families={arch:'arch',gentoo:'independent',void:'independent',omarchy:'arch',zorin:'debian',pop:'debian',mint:'debian',debian:'debian',ubuntu:'debian',fedora:'fedora',cachy:'arch',endeavour:'arch',alpine:'independent',nixos:'independent',bazzite:'fedora',opensuse:'suse',artix:'arch'};
  app.familyLabels={all:'все семейства',arch:'Arch',debian:'Debian / Ubuntu',fedora:'Fedora',suse:'SUSE',independent:'независимые',desktop:'окружения',wm:'оконные менеджеры'};
  app.votingCandidates=distros.map(d=>({id:d.id,name:d.name,kind:'distro',family:families[d.id],logo:`assets/${d.id}.svg`}));
  app.votingCandidates.push(
    {id:'manjaro',name:'Manjaro',kind:'distro',family:'arch',logo:'assets/manjaro.svg'},
    {id:'gnome',name:'GNOME',kind:'de',family:'desktop',logo:'assets/gnome.svg'},
    {id:'plasma',name:'KDE Plasma',kind:'de',family:'desktop',logo:'assets/kdeplasma.svg'},
    {id:'xfce',name:'Xfce',kind:'de',family:'desktop',logo:'assets/xfce.svg'},
    {id:'hyprland',name:'Hyprland',kind:'wm',family:'wm',logo:'assets/hyprland.svg'},
    {id:'sway',name:'Sway',kind:'wm',family:'wm',logo:'assets/sway.svg'},
    {id:'i3',name:'i3',kind:'wm',family:'wm',logo:'assets/i3.svg'}
  );
  app.votingCategories=[
    {id:'favorite',name:'любимый дистрибутив',kind:'distro'},
    {id:'beginner',name:'лучший для новичков',kind:'distro'},
    {id:'lightweight',name:'лучший для слабых ПК',kind:'distro'},
    {id:'customization',name:'лучший для кастомизации',kind:'distro'},
    {id:'developer',name:'лучший для разработчиков',kind:'distro'},
    {id:'desktop',name:'лучший Desktop Environment',kind:'de'},
    {id:'wm',name:'лучший Window Manager',kind:'wm'}
  ];
})(globalThis);
