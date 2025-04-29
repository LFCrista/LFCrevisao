"use client"

import * as React from "react"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { supabase } from "@/lib/supabase" // Ajuste para a importação do seu cliente Supabase

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Definindo o schema de validação com Zod
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

// Tipagem para os dados do formulário
type FormData = z.infer<typeof formSchema>

export function FormUser() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Usando o hook useForm para controlar o formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const { control, handleSubmit, formState: { errors }, reset } = form;

  // Função de envio do formulário para o Supabase
  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      })

      if (error) throw error

      alert("Cadastro realizado com sucesso! Verifique seu e-mail.")

      // Limpa os campos após o cadastro bem-sucedido
      reset()

    } catch (error: any) {
      setError(error.message) // Trata o erro do Supabase
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Campo de Nome */}
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage>{errors.name?.message}</FormMessage>
            </FormItem>
          )}
        />

        {/* Campo de Email */}
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Seu email" type="email" {...field} />
              </FormControl>
              <FormMessage>{errors.email?.message}</FormMessage>
            </FormItem>
          )}
        />

        {/* Campo de Senha */}
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="Sua senha" type="password" {...field} />
              </FormControl>
              <FormMessage>{errors.password?.message}</FormMessage>
            </FormItem>
          )}
        />

        {/* Exibe erro, se houver */}
        {error && <p className="text-red-500">{error}</p>}

        {/* Botão de envio */}
        <Button type="submit" disabled={loading}>
          {loading ? "Carregando..." : "Cadastrar"}
        </Button>
      </form>
    </Form>
  )
}
