import React, { useEffect, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  RemoveFormatting,
  Table as TableIcon,
  Code,
  Undo,
  Redo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva o conteúdo completo do artigo...',
  minHeight = '360px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChangeRef = useRef(false)
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({})

  // Modal / Popover para inserir e editar Link
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [isEditingExistingLink, setIsEditingExistingLink] = useState(false)
  const activeAnchorRef = useRef<HTMLAnchorElement | null>(null)
  const savedSelectionRef = useRef<Range | null>(null)

  // Modal para inserir Imagem (via URL ou Upload base64/arquivo)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')

  // Modal para inserir Tabela
  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)

  // Sincronizar value externo apenas quando diferente do DOM
  useEffect(() => {
    if (!editorRef.current) return
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false
      return
    }
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const findClosestAnchor = (node: Node | null): HTMLAnchorElement | null => {
    let curr: Node | null = node
    while (curr && curr !== editorRef.current) {
      if (curr.nodeType === Node.ELEMENT_NODE && (curr as HTMLElement).tagName === 'A') {
        return curr as HTMLAnchorElement
      }
      curr = curr.parentNode
    }
    return null
  }

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      // Garantir que a seleção está dentro do nosso editor
      if (
        editorRef.current &&
        (editorRef.current.contains(range.commonAncestorContainer) ||
          editorRef.current === range.commonAncestorContainer)
      ) {
        savedSelectionRef.current = range.cloneRange()
        return
      }
    }
    savedSelectionRef.current = null
  }

  const restoreSelection = () => {
    if (!savedSelectionRef.current) return
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedSelectionRef.current)
    }
  }

  const handleInput = () => {
    if (!editorRef.current) return
    isInternalChangeRef.current = true
    const html = editorRef.current.innerHTML
    // Se estiver vazio com só br ou whitespace, limpa
    if (html === '<br>' || html.trim() === '') {
      onChange('')
    } else {
      onChange(html)
    }
    updateActiveFormats()
  }

  const updateActiveFormats = () => {
    if (!editorRef.current) return
    try {
      const sel = window.getSelection()
      let hasLink = false
      if (sel && sel.rangeCount > 0) {
        const anchor = findClosestAnchor(sel.anchorNode)
        hasLink = Boolean(anchor)
      }
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        link: hasLink,
      })
    } catch {
      // Ignora erro se seleção estiver fora
    }
  }

  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, arg)
    handleInput()
  }

  const applyBlockFormat = (tag: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    // formatBlock espera <H1>, <H2>, <H3>, <P>, <BLOCKQUOTE>
    document.execCommand('formatBlock', false, tag)
    handleInput()
  }

  const formatUrl = (raw: string): string => {
    const trimmed = raw.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }
    if (/^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
      return trimmed
    }
    // Para domínios diretos ou www., prefixa https://
    return `https://${trimmed}`
  }

  const openLinkModal = () => {
    // Se a seleção ainda não foi salva pelo onMouseDown, salva agora
    if (!savedSelectionRef.current) {
      saveSelection()
    }

    let currentAnchor: HTMLAnchorElement | null = null
    const sel = window.getSelection()

    if (sel && sel.rangeCount > 0) {
      currentAnchor = findClosestAnchor(sel.anchorNode) || findClosestAnchor(sel.focusNode)
    }

    if (!currentAnchor && savedSelectionRef.current) {
      currentAnchor =
        findClosestAnchor(savedSelectionRef.current.commonAncestorContainer) ||
        findClosestAnchor(savedSelectionRef.current.startContainer)
    }

    if (currentAnchor) {
      activeAnchorRef.current = currentAnchor
      setIsEditingExistingLink(true)
      setLinkUrl(currentAnchor.getAttribute('href') || '')
      setLinkText(currentAnchor.textContent || '')
    } else {
      activeAnchorRef.current = null
      setIsEditingExistingLink(false)
      let text = ''
      if (savedSelectionRef.current && !savedSelectionRef.current.collapsed) {
        text = savedSelectionRef.current.toString()
      } else if (sel) {
        text = sel.toString()
      }
      setLinkText(text)
      setLinkUrl('')
    }
    setLinkModalOpen(true)
  }

  const handleSaveLink = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setLinkModalOpen(false)
    const formattedUrl = formatUrl(linkUrl)
    if (!formattedUrl) return

    if (!editorRef.current) return
    editorRef.current.focus()

    // Caso 1: Estava editando um link existente
    if (activeAnchorRef.current && editorRef.current.contains(activeAnchorRef.current)) {
      const anchor = activeAnchorRef.current
      anchor.setAttribute('href', formattedUrl)
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noopener noreferrer')
      anchor.classList.add('text-primary', 'underline', 'font-medium')
      if (linkText.trim() && anchor.textContent !== linkText.trim()) {
        anchor.textContent = linkText.trim()
      }
      activeAnchorRef.current = null
      handleInput()
      return
    }

    // Caso 2: Nova inserção com seleção restaurada
    restoreSelection()
    const sel = window.getSelection()

    const originalSelectedText = savedSelectionRef.current
      ? savedSelectionRef.current.toString()
      : ''

    if (
      !savedSelectionRef.current ||
      savedSelectionRef.current.collapsed ||
      (linkText.trim() && linkText.trim() !== originalSelectedText)
    ) {
      const display = linkText.trim() || formattedUrl
      const tempId = `temp-link-${Date.now()}`
      const linkHtml = `<a id="${tempId}" href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="text-primary underline font-medium">${display}</a>`
      document.execCommand('insertHTML', false, linkHtml)
      const inserted = editorRef.current.querySelector(`#${tempId}`)
      if (inserted) {
        inserted.removeAttribute('id')
      }
    } else {
      // Inserir link mantendo o texto exato selecionado
      // Para garantir que o link recém-criado receba target="_blank" e rel="noopener noreferrer",
      // usamos uma URL temporária única
      const uniqueMarker = `https://temp-link-marker-${Date.now()}.local`
      document.execCommand('createLink', false, uniqueMarker)
      const matchingAnchors = editorRef.current.querySelectorAll(`a[href="${uniqueMarker}"]`)
      matchingAnchors.forEach((a) => {
        a.setAttribute('href', formattedUrl)
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
        a.classList.add('text-primary', 'underline', 'font-medium')
      })
      if (matchingAnchors.length === 0 && sel && sel.rangeCount > 0) {
        const anchor = findClosestAnchor(sel.anchorNode) || findClosestAnchor(sel.focusNode)
        if (anchor) {
          anchor.setAttribute('href', formattedUrl)
          anchor.setAttribute('target', '_blank')
          anchor.setAttribute('rel', 'noopener noreferrer')
          anchor.classList.add('text-primary', 'underline', 'font-medium')
        }
      }
    }

    // Normaliza todos os <a> dentro do editor para terem target="_blank" e rel="noopener noreferrer"
    const allLinks = editorRef.current.querySelectorAll('a')
    allLinks.forEach((a) => {
      if (!a.getAttribute('target')) a.setAttribute('target', '_blank')
      if (!a.getAttribute('rel')) a.setAttribute('rel', 'noopener noreferrer')
      a.classList.add('text-primary', 'underline', 'font-medium')
    })

    handleInput()
  }

  const handleRemoveLink = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setLinkModalOpen(false)

    if (activeAnchorRef.current && editorRef.current?.contains(activeAnchorRef.current)) {
      const anchor = activeAnchorRef.current
      const parent = anchor.parentNode
      while (anchor.firstChild) {
        parent?.insertBefore(anchor.firstChild, anchor)
      }
      parent?.removeChild(anchor)
      activeAnchorRef.current = null
      handleInput()
      return
    }

    restoreSelection()
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand('unlink', false)
    handleInput()
  }

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const anchor = target.closest('a')
    if (anchor && editorRef.current?.contains(anchor)) {
      // Se clicou segurando Ctrl / Meta, abre o link
      if (e.ctrlKey || e.metaKey) {
        const href = anchor.getAttribute('href')
        if (href) {
          window.open(href, '_blank', 'noopener,noreferrer')
        }
        return
      }
      // Caso contrário, seleciona o link e abre o diálogo de edição para conveniência
      activeAnchorRef.current = anchor
      setIsEditingExistingLink(true)
      setLinkUrl(anchor.getAttribute('href') || '')
      setLinkText(anchor.textContent || '')
      saveSelection()
      setLinkModalOpen(true)
    }
  }

  const openImageModal = () => {
    saveSelection()
    setImageUrl('')
    setImageAlt('')
    setImageModalOpen(true)
  }

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImageModalOpen(false)
    if (!imageUrl.trim()) return

    restoreSelection()
    if (!editorRef.current) return
    editorRef.current.focus()

    const altAttr = imageAlt.trim() ? ` alt="${imageAlt.trim()}"` : ' alt="Imagem do artigo"'
    const imgHtml = `<figure class="my-6 block"><img src="${imageUrl.trim()}"${altAttr} class="rounded-xl border max-w-full h-auto mx-auto shadow-sm" />${
      imageAlt.trim()
        ? `<figcaption class="text-xs text-center text-muted-foreground mt-1.5">${imageAlt.trim()}</figcaption>`
        : ''
    }</figure><p><br></p>`
    document.execCommand('insertHTML', false, imgHtml)
    handleInput()
  }

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      if (base64) {
        setImageUrl(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const openTableModal = () => {
    saveSelection()
    setTableModalOpen(true)
  }

  const handleInsertTable = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTableModalOpen(false)
    restoreSelection()
    if (!editorRef.current) return
    editorRef.current.focus()

    const rows = Math.max(1, Math.min(20, tableRows))
    const cols = Math.max(1, Math.min(10, tableCols))

    let tableHtml =
      '<div class="my-6 overflow-x-auto"><table class="w-full text-left border-collapse border border-border text-sm rounded-lg overflow-hidden"><thead><tr class="bg-muted">'
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th class="border border-border p-2.5 font-semibold text-foreground">Coluna ${c + 1}</th>`
    }
    tableHtml += '</tr></thead><tbody>'
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr class="even:bg-muted/30">'
      for (let c = 0; c < cols; c++) {
        tableHtml += '<td class="border border-border p-2.5 text-muted-foreground">Dado</td>'
      }
      tableHtml += '</tr>'
    }
    tableHtml += '</tbody></table></div><p><br></p>'

    document.execCommand('insertHTML', false, tableHtml)
    handleInput()
  }

  return (
    <div className="flex flex-col rounded-xl border bg-background shadow-xs">
      {/* Barra de Ferramentas / Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2 text-foreground">
        {/* Desfazer / Refazer */}
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('undo')}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('redo')}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refazer (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Formatação básica */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.bold ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('bold')}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Negrito (Ctrl+B)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.italic ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('italic')}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Itálico (Ctrl+I)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.underline ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('underline')}
              >
                <Underline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sublinhado (Ctrl+U)</TooltipContent>
          </Tooltip>
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Títulos H1, H2, H3 e Parágrafo */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 font-extrabold"
                onClick={() => applyBlockFormat('H1')}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Título H1</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 font-bold"
                onClick={() => applyBlockFormat('H2')}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Título H2</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyBlockFormat('H3')}
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Título H3</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-semibold"
                onClick={() => applyBlockFormat('P')}
              >
                Parágrafo
              </Button>
            </TooltipTrigger>
            <TooltipContent>Parágrafo normal</TooltipContent>
          </Tooltip>
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Listas e Citações */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.insertUnorderedList ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('insertUnorderedList')}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lista com marcadores</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.insertOrderedList ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('insertOrderedList')}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lista numerada</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyBlockFormat('BLOCKQUOTE')}
              >
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bloco de citação</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyBlockFormat('PRE')}
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bloco de código pré-formatado</TooltipContent>
          </Tooltip>
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Alinhamento */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.justifyLeft ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('justifyLeft')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Alinhar à esquerda</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.justifyCenter ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('justifyCenter')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Centralizar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.justifyRight ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('justifyRight')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Alinhar à direita</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.justifyFull ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('justifyFull')}
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Justificar</TooltipContent>
          </Tooltip>
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Inserções: Link, Imagem, Tabela e Limpar Formatação */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={activeFormats.link ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onMouseDown={(e) => {
                  // Salva a seleção no momento do clique no botão antes de perder o foco
                  saveSelection()
                }}
                onClick={openLinkModal}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {activeFormats.link ? 'Editar link selecionado' : 'Inserir link no texto selecionado'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRemoveLink}
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover link</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={openImageModal}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Inserir imagem</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={openTableModal}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Inserir tabela</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => execCmd('removeFormat')}
              >
                <RemoveFormatting className="h-4 w-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover formatação</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Área Editável (contentEditable) com tipografia moderna */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onClick={handleEditorClick}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="prose prose-stone dark:prose-invert max-w-none p-5 outline-none focus:ring-1 focus:ring-primary/20 text-foreground text-base leading-relaxed overflow-y-auto [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none prose-a:text-primary prose-a:underline prose-a:font-medium hover:prose-a:opacity-80"
      />

      {/* Modal / Diálogo de Link */}
      <Dialog
        open={linkModalOpen}
        onOpenChange={(open) => {
          setLinkModalOpen(open)
          if (!open) {
            activeAnchorRef.current = null
          }
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => {
            // Evita fechar abruptamente se clicar na borda
          }}
        >
          <form onSubmit={handleSaveLink}>
            <DialogHeader>
              <DialogTitle>
                {isEditingExistingLink ? 'Editar Hiperlink' : 'Inserir Hiperlink'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="link-text">Texto exibido</Label>
                <Input
                  id="link-text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Ex.: Clique aqui para acessar o material"
                />
                <p className="text-[11px] text-muted-foreground">
                  Se você selecionou um texto no editor, ele será transformado no link.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-url">URL do link (destino)</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com.br ou www.exemplo.com.br"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Links como "www.exemplo.com" receberão "https://" automaticamente.
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2">
              <div>
                {isEditingExistingLink && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRemoveLink}
                  >
                    <Unlink className="mr-1.5 h-3.5 w-3.5" /> Remover link
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setLinkModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditingExistingLink ? 'Salvar alterações' : 'Aplicar link'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Imagem */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleInsertImage}>
            <DialogHeader>
              <DialogTitle>Inserir Imagem no Conteúdo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Upload do arquivo local</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  Selecione uma imagem do computador ou informe uma URL abaixo.
                </p>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="h-px w-full bg-border" />
                <span className="absolute bg-background px-2 text-xs uppercase text-muted-foreground">
                  ou URL direta
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="img-url">URL da imagem</Label>
                <Input
                  id="img-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="img-alt">Legenda / Descrição alternativa</Label>
                <Input
                  id="img-alt"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Ex.: Auditoria de extintores e hidrantes na unidade"
                />
              </div>

              {imageUrl && (
                <div className="rounded-lg border p-2 bg-muted/20">
                  <p className="text-xs font-semibold mb-1">Prévia da imagem:</p>
                  <img
                    src={imageUrl}
                    alt="Prévia"
                    className="max-h-40 mx-auto rounded object-contain"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setImageModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!imageUrl.trim()}>
                Inserir Imagem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Tabela */}
      <Dialog open={tableModalOpen} onOpenChange={setTableModalOpen}>
        <DialogContent className="sm:max-w-xs">
          <form onSubmit={handleInsertTable}>
            <DialogHeader>
              <DialogTitle>Inserir Tabela Simples</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tab-rows">Linhas</Label>
                  <Input
                    id="tab-rows"
                    type="number"
                    min="1"
                    max="15"
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tab-cols">Colunas</Label>
                  <Input
                    id="tab-cols"
                    type="number"
                    min="1"
                    max="8"
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTableModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Tabela</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
