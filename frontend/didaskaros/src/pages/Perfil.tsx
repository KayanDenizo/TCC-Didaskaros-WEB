// PROVISÓRIO: a tela Meu Perfil é da Julia (protótipo de alta no Figma, página
// Dashboard Coordenador). Fica em branco até ela implementar.
import { ReactNode } from "react";
import type { InputHTMLAttributes } from "react";

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
}

export function Navegation({ icon, title }: NavegationProps) {
  return (
    <div className=" text-[#a3a3a3]">
      <div className="focus:bg-[#1d4ed8]/30">
        <span className="material-symbols-outlined focus:text-[#1d4ed8]">{icon}</span>
        <div className="focus:text-bold focus:text-[#1d4ed8]">{title}</div>
      </div>
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

export function InputF({ label, disabled, wClassName,...props }: InputProps) {
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

interface BoxProps {
  box: string;
  selected?: string;
  label: string;
}

export function Box ({box, selected, label}: BoxProps) {
  return (

    <div className="">
       <label className="uppercase font-bold text-[#4b5563]">
        {label}
      </label>
      
    </div>

  )
}


export function ProfilePage() {
  return (

    <div>

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
              btn="hover:bg-blue-700 bg-gradient-to-r from-[#2353aa] via-[#296fe7] to-[#3883e5] text-white"
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

          <Navegation icon="person" title="Dados pessoais" />
          <Navegation icon="domain" title="Dados institucionais" />
          <Navegation icon="lock" title="Segurança" />
          <Navegation icon="setttings" title="Preferências" />

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

              <div className="text-[#1e40af] text-[15px] font-semibold bg-[#93c5fd]/20 border-2 border-[#1d4ed8]/10 p-3 col-span-6 rounded-[15px]">Algum dado está errado? Peça correção à direção da unidade.</div>
            </div>

          </SectionContainer>
        </div>

      </div>
    </div>
  )
}
