// tela Meu Perfil, feita pela Julia (prototipo de alta no Figma, pagina
// Dashboard Coordenador)
import { ReactNode } from "react";
import { useState } from "react";

export default function Perfil() {
  return <ProfilePage />;
}

interface HeaderProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="flex justify-between items-center gap-5 px-7 py-3 w-[100%]">

      <div>
        <h1 className="font-bold text-[28px]">{title}</h1>
        <span>{subtitle}</span>
      </div>

      {children}

    </header>
  )
}

interface BtnProps {
  title: string;
  btn: string;
}

export function Btn({ title, btn }: BtnProps) {
  return (

    <button
      className={`p-5 rounded-lg flex align-center border font-semibold px-6 py-2 rounded-[18px] flex items-center gap-2 cursor-pointer transition ${btn}`}>
      {title}</button>

  )
}

interface CardProfileProps {
  nome: string;
  iniciais: string;
  categoria: string;
  unidade: string;
  children: ReactNode;
}

export function CardProfile({ nome, iniciais, categoria, unidade, children }: CardProfileProps) {
  return (
    <div className="card bg-white rounded-[15px] min-w-[500px]">


      <div className="flex flex-col items-center justify-center relative">
        <div
          className=" bg-gradient-to-r from-[#112963] via-[#2149ac] to-[#296fe7] w-full h-[100px] bg-clip rounded-t-[12px]">
        </div>
        <div
          className="pfp absolute shadow-[0 0 8px rgba(0, 0, 0, 0.4)] top-0 border-8 border-white w-[140px] h-[140px] rounded-full bg-gradient-to-r from-[#2d6ced] to-[#579bf8] flex items-center justify-center text-white text-[50px] my-2 font-bold">
          {iniciais}
          <div
            className="shadow-[0 0 8px rgba(0, 0, 0, 0.4)] bottom-0 top-0 translate-x-[18%] translate-y-[25%] bg-white w-[45px] h-[45px] rounded-full flex justify-center items-center">
            {/* <span className="material-symbols-outlined text-[#5b8af0]">
              photo_camera
              </span> */}
          </div>
        </div>
      </div>

      <div className="infoNames flex flex-col items-center text-[14px] gap-1 mt-[65px]">
        <h1 className="font-bold text-[21px]">{nome}</h1>
        <p>{categoria}</p>

        <div
          className="bg-[#5b8af0]/10 rounded-full px-3 py-1 font-bold text-[#1d4ed8] uppercase my-4">
          {unidade}</div>
      </div>

      {children}

    </div>
  )
}

interface InfosCardProps {
  title: string;
  subtitle: string;
}

export function InfosCard({ title, subtitle }: InfosCardProps) {
  return (

    <div className="w-100%">
      <div className="flex justify-between mb-[10px] w-100%">
        <div className="text-[#a3a3a3]">{title}</div>
        <div className="font-bold text-[#374151]">{subtitle}</div>
      </div>
    </div>
  )
}

interface NavegationProps {
  icon: string;
  title: string;
  selected?: boolean;
  onClick?: () => void;
}

export function Navegation({ icon, title, selected = false, onClick }: NavegationProps) {
  return (
    <div className="rounded-[15px] my-[5px]">
      <button
        onClick={onClick}
        className={`relative container flex gap-3 w-full h-[43px] items-center
      ${selected
            ? "font-bold text-[#1d4ed8] bg-[#1d4ed8]/20 "
            : "text-[#00000]"
          }
        
        `} >
        {selected && (
          <span className=" absolute left-0 top-0 bottom-0 bg-[#3b82f6] h-[full] w-[4px]"></span>
        )}

        <span className="material-symbols-outlined focus:text-[#1d4ed8] mx-2">{icon}</span>
        {title}</button>
    </div>
  )
}


interface SectionContainerProps {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  tag?: string;
}

export function SectionContainer({ title, description, children, className, tag }: SectionContainerProps) {
  return (
    <section className={`bg-white rounded-[12px] ${className}`}>
      <div className="p-5">
        <div className="flex justify-between">
          <h1 className="font-bold text-[20px]">{title}</h1>
          {tag && (
            <span className="bg-[#a3a3a3]/50 text-[#727272] px-3 py-2 rounded-full text-xs">
              {tag}
            </span>
          )}
        </div>
        <p className="text-[#a3a3a3] text-[17px]">{description}</p>
      </div>

      {children}

    </section>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wClassName?: string;
}

export function InputF({ label, disabled, children, wClassName, ...props }: InputProps) {
  return (
    <div className={`flex flex-col gap-1 w-full ${wClassName}`}>
      <label className="uppercase font-bold text-[#4b5563]">
        {label}
      </label>

      <input
        disabled={disabled}
        {...props}
        maxLength={props.maxLength}
        className={` ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed p-[9px] rounded-[12px] border-2 border-[#a3a3a3]/50" : "bg-white text-gray-700 rounded-[12px] p-[9px] outline outline-2  outline-[#a3a3a3]/60 focus:outline-[#3b82f6]"
          }`}
      />

      {/*   {disabled && (
        <span className="material-symbols-outlined absolute right-3 text-gray-400 text-lg pointer-events-none">
          lock
        </span>
      )} */}
    </div>
  );
}

interface TurnoProps {
  turno: string;
  selected?: boolean;
}

export function Turno({ turno, selected = false }: TurnoProps) {
  return (
    <div
      className={`
        px-4 py-2 rounded-xl border text-sm cursor-default
        ${selected
          ? "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]"
          : "bg-[#f9fafb] text-[#9ca3af] border-[#e5e7eb]"
        }
      `}
    >
      {turno}
    </div>
  );
}


interface SenhaProps {
  senha: string;
}

export function Senha({ senha }: SenhaProps) {

  const requisitos = [
    {
      label: "8 caracteres ou mais",
      valido: senha.length >= 8
    },
    {
      label: "Uma letra maiúscula",
      valido: /[A-Z]/.test(senha)
    },
    {
      label: "Um número",
      valido: /[0-9]/.test(senha)
    },
    {
      label: "Um símbolo (!@#)",
      valido: /[^a-zA-Z0-9]/.test(senha)
    }
  ];

  const quantidade = requisitos.filter(
    (item) => item.valido
  ).length;

  const forte = quantidade >= 3;

  return (
    <div className="w-full flex flex-col gap-3">

      <div className="grid grid-cols-4 gap-1.5">
        {requisitos.map((item, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full ${item.valido
              ? "bg-[#10b981]"
              : "bg-[#e5e7eb]"
              }`}
          />
        ))}
      </div>

      <span
        className={`text-xs font-semibold text-right ${forte ? "text-[#059669]" : "text-red-500"
          }`}
      >
        {forte ? "Senha forte" : "Senha fraca"}
      </span>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {requisitos.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 text-xs ${item.valido
              ? "text-[#111827]"
              : "text-[#9ca3af]"
              }`}
          >
            <span className={
              item.valido
                ? "text-[#10b981]"
                : "text-[#cbd5e1]"
            }>
              {item.valido ? "✓" : "○"}
            </span>

            {item.label}
          </div>
        ))}
      </div>

    </div>
  );
}


interface InteProps {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  title: string;
  description: string;
}

export function Inte({ defaultChecked = true, onChange, title, description }: InteProps) {
  const [ativo, setAtivo] = useState(defaultChecked);

  function alternar() {
    const novoValor = !ativo;

    setAtivo(novoValor);
    onChange?.(novoValor);
  }

  return (
    <div className="flex items-center justify-between p-5">

      <div className="">
        <h1 className="font-bold text-[20px]">{title}</h1>
        <p className="text-[#a3a3a3] text-[17px]">{description}</p>
      </div>

      <button
        type="button"
        onClick={alternar}
        className={`w-[70px] h-[30px] rounded-full flex items-center px-1 py-4 transition-colors ${ativo ? "bg-[#2563eb]" : "bg-[#e5e7eb]"
          }`}
      >
        <span
          className={`w-6 h-6 bg-white rounded-full transition-transform ${ativo ? "translate-x-9" : "translate-x-0"
            }`}
        />
      </button>

    </div>
  );
}

export function ProfilePage() {

  const [novaSenha, setNovaSenha] = useState("");
  const [itemSelecionado, setItemSelecionado] = useState('pessoais');

  return (

    <div className="cursor-default">

      <div className="flex justify-between w-full">
        <Header
          title="Meu Perfil"
          subtitle="Seus dados de acesso, informações pessoais e preferências do sistema."
        >

          <div className="flex gap-3">
            <Btn
              title="Descartar alterações"
              btn="hover:bg-gray-200"
            />

            <Btn
              title="Salvar alterações"
              btn="shine-on-hover hover:bg-blue-700 bg-gradient-to-r from-[#2353aa] via-[#296fe7] to-[#3883e5] text-white"
            />
          </div>

        </Header>
      </div>

      <div className="flex justify-between p-[30px] gap-9">

        <div className="flex flex-col">
          <CardProfile
            nome="Maria Costa"
            iniciais="MC"
            categoria="Coordenadora de Curso"
            unidade="ETEC Uirapuru - 230">
            <hr />

            <div className="p-5">

              <InfosCard title="Curso" subtitle="Desenvolvimento de Sistemas" />
              <InfosCard title="Turnos" subtitle="Manhã e Noite" />
              <InfosCard title="Na coordenação desde" subtitle="Fevereiro de 2022" />
              <InfosCard title="Último acesso" subtitle="Hoje, 08:14" />

            </div>

          </CardProfile>

          <div className="my-[15px] bg-white rounded-[15px] border-2 border-[#a3a3a3]/20">
            <Navegation icon="person" title="Dados pessoais" selected={itemSelecionado === 'pessoais'} onClick={() => setItemSelecionado('pessoais')} />
            <Navegation icon="domain" title="Dados institucionais" selected={itemSelecionado === 'institucionais'} onClick={() => setItemSelecionado('institucionais')} />
            <Navegation icon="lock" title="Segurança" selected={itemSelecionado === 'seguranca'} onClick={() => setItemSelecionado('seguranca')} />
            <Navegation icon="settings" title="Preferências" selected={itemSelecionado === 'preferencias'} onClick={() => setItemSelecionado('preferencias')} />
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full">

          <SectionContainer
            title="Dados Pessoais"
            description="Usados para identificar você no sistema e nos contatos da unidade.">

            <hr />
            <div className="p-5 grid grid-cols-6 gap-3">
              <InputF
                label="Nome Completo" defaultValue="Maria Costa" wClassName="col-span-6" />
              <InputF label="CPF" defaultValue="529.982.247-25" disabled wClassName="col-span-2" />
              <InputF label="Data de Nascimento" defaultValue="01/02/2000" disabled wClassName="col-span-2" />
              <InputF label="Telefone" defaultValue="1199990000" type="number" inputMode="numeric" wClassName="col-span-2" />
              <InputF label="E-mail Institucional" defaultValue="maria.costa@etec.cps.sp.gov.br" disabled wClassName="col-span-3" />
              <InputF label="E-mail Pessoal" defaultValue="maria.costa@gmail.com" disabled wClassName="col-span-3" />
            </div>
          </SectionContainer>

          <SectionContainer
            title="Dados Institucionais"
            description="Vínculo com a unidade."
            tag="Gerenciado pela direção">
            <hr />

            <div className="p-5 grid grid-cols-6 gap-5">
              <InputF label="Unidade" defaultValue="Etec Uirapuru (230), São Paulo" disabled wClassName="col-span-3" />
              <InputF label="Curso" defaultValue="Desenvolvimento de Sistemas" disabled wClassName="col-span-3" />
              <InputF label="Registro Funcional" defaultValue="12345678" disabled wClassName="col-span-2" />
              <InputF label="Categoria" defaultValue="Coordenador de Curso" disabled wClassName="col-span-2" />
              <InputF label="Na coordenação desde" defaultValue="01/02/2022" disabled wClassName="col-span-2" />

              <div className="flex-col items-center">

                <label className="uppercase font-bold text-[#4b5563] ">Turnos em que coordena</label>

                <div className="flex gap-2">
                  <Turno turno="Manhã" selected={true} />
                  <Turno turno="Tarde" />
                  <Turno turno="Noite" selected={true} />
                </div>
              </div>
              <div className="text-[#1e40af] text-[15px] font-semibold bg-[#93c5fd]/20 border-2 border-[#1d4ed8]/10 p-3 col-span-6 rounded-[15px]">Algum dado está errado? Peça correção à direção da unidade.</div>
            </div>

          </SectionContainer>

          <SectionContainer
            title="Segurança"
            description="Altere sua senha e controle onde sua conta está conectada.">
            <hr />
            <div className="grid-cols-6 flex gap-5 p-5">
              <InputF label="Senha atual" wClassName="col-span-2" type="password" />
              <InputF label="Nova senha" wClassName="col-span-2" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
              <InputF label="Confirmar nova senha" wClassName="col-span-2" type="password" />
            </div>

            <div className="px-5 pb-5">
              <Senha senha={novaSenha} />
            </div>
            <hr />

            <div className="flex justify-between w-full">
              <SectionContainer className="flex"
                title="Conectada em 2 dispositivos"
                description="Este navegador (Chrome, Windows) e navegador Safari, IOS.">
              </SectionContainer>
              <div className="gap-3 flex items-center">
                <div className="">
                  <button className="text-[#dc2626] font-bold border-2 border-[#dc2626]/30 p-3 rounded-[17px]">Sair de outros dispositivos</button>
                </div>
                <div className="">
                  <button className="font-bold border-2 border-[#a3a3a3]/50 p-3 rounded-[17px]">Atualizar senha</button>
                </div>
              </div>
            </div>
          </SectionContainer>

          <SectionContainer
            title="Preferêcias"
            description="Como a Didaskaros se comporta para você.">
            <hr />

            <div className="p-5">
              <Inte
                title="Avisos da Didaskaros IA"
                description="Mostrar o que falta ou está inscosistente nos cadastros antes de gerar uma grade" />
              <hr />
              <Inte
                title="Confirmar antes de publicar"
                description="Pedir confirmação antes de publicar uma grade, pois a grade é substituída assim que renovada." />
              <hr />
              <Inte
                title="Animações da interface"
                description="Desligue se desejar a interface sem movimento." />
              <hr />
              <Inte
                title="Manter esta conta conectada a esse navegador"
                description="Continuar com a sessão aberta depois de fechar o navegador." />
            </div>
          </SectionContainer>

        </div>

      </div>
    </div>
  )
}
