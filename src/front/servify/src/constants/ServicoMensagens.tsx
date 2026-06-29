import type { ReactNode } from 'react'

export function mensagemInativarServico(nome: string): ReactNode {
    return (
        <>
            Deseja inativar <strong>{nome || 'este serviço'}</strong>?
            <br /><br />
            Agendamentos existentes para esse serviço serão mantidos e devem ser
            cancelados individualmente, se necessário.
            <br /><br />
            Não será possível realizar novos agendamentos para esse serviço enquanto
            ele estiver inativo.
        </>
    )
}

export function mensagemReativarServico(nome: string): ReactNode {
    return (
        <>
            Deseja reativar <strong>{nome || 'este serviço'}</strong>?
            <br /><br />
            O serviço voltará a estar disponível para novos agendamentos.
        </>
    )
}