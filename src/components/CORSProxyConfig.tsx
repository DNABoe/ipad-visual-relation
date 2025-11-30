import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, WarningCircle, Spinner } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CORSProxyConfigProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CORS_PROXIES = [
  {
    name: 'AllOrigins',
    url: (targetUrl: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    description: 'Reliable general-purpose CORS proxy',
    enabled: true
  },
  {
    name: 'CORSProxy.io',
    url: (targetUrl: string) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    description: 'Fast and stable proxy service',
    enabled: true
  },
  {
    name: 'CORS.SH',
    url: (targetUrl: string) => `https://cors.sh/${targetUrl}`,
    description: 'Lightweight CORS proxy',
    enabled: true
  },
  {
    name: 'ThingProxy',
    url: (targetUrl: string) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
    description: 'Legacy but reliable proxy',
    enabled: true
  },
  {
    name: 'Proxy6.dev',
    url: (targetUrl: string) => `https://proxy6.dev/api/proxy?url=${encodeURIComponent(targetUrl)}`,
    description: 'Alternative proxy option',
    enabled: false
  }
]

type ProxyStatus = 'idle' | 'testing' | 'success' | 'error'

export function CORSProxyConfig({ open, onOpenChange }: CORSProxyConfigProps) {
  const [useDirectMode, setUseDirectMode] = useState(false)
  const [customProxyUrl, setCustomProxyUrl] = useState('')
  const [proxyStatuses, setProxyStatuses] = useState<Record<string, ProxyStatus>>(
    Object.fromEntries(CORS_PROXIES.map(p => [p.name, 'idle' as ProxyStatus]))
  )
  const [proxyErrors, setProxyErrors] = useState<Record<string, string>>({})

  const testProxy = async (proxy: typeof CORS_PROXIES[0]) => {
    setProxyStatuses(prev => ({ ...prev, [proxy.name]: 'testing' }))
    setProxyErrors(prev => ({ ...prev, [proxy.name]: '' }))

    try {
      const testUrl = 'https://api.openai.com/v1/models'
      const proxyUrl = proxy.url(testUrl)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok || response.status === 401) {
        setProxyStatuses(prev => ({ ...prev, [proxy.name]: 'success' }))
        toast.success(`${proxy.name} is working`)
      } else {
        setProxyStatuses(prev => ({ ...prev, [proxy.name]: 'error' }))
        setProxyErrors(prev => ({ ...prev, [proxy.name]: `HTTP ${response.status}` }))
      }
    } catch (error) {
      setProxyStatuses(prev => ({ ...prev, [proxy.name]: 'error' }))
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setProxyErrors(prev => ({ ...prev, [proxy.name]: 'Timeout' }))
        } else {
          setProxyErrors(prev => ({ ...prev, [proxy.name]: error.message }))
        }
      }
    }
  }

  const testAllProxies = async () => {
    for (const proxy of CORS_PROXIES) {
      await testProxy(proxy)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const getStatusIcon = (status: ProxyStatus) => {
    switch (status) {
      case 'testing':
        return <Spinner className="h-5 w-5 text-primary animate-spin" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" weight="fill" />
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" weight="fill" />
      default:
        return <WarningCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CORS Proxy & API Configuration</DialogTitle>
          <DialogDescription>
            Configure how RelEye connects to AI services. Use direct API mode when possible, or select CORS proxies for browser environments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-md">
            <div className="flex-1">
              <Label htmlFor="direct-mode" className="text-base font-semibold">
                Direct API Mode
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Connect directly to AI providers without CORS proxies. More reliable but may not work in all browsers.
              </p>
            </div>
            <Switch
              id="direct-mode"
              checked={useDirectMode}
              onCheckedChange={setUseDirectMode}
            />
          </div>

          {!useDirectMode && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">CORS Proxy Services</Label>
                  <Button onClick={testAllProxies} variant="outline" size="sm">
                    Test All Proxies
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  These services route API requests through their servers to bypass browser CORS restrictions.
                </p>
              </div>

              <div className="space-y-2">
                {CORS_PROXIES.map((proxy) => (
                  <div
                    key={proxy.name}
                    className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(proxyStatuses[proxy.name])}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium">{proxy.name}</span>
                        {proxy.enabled && (
                          <span className="text-xs text-success">Enabled</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {proxy.description}
                      </p>
                      {proxyErrors[proxy.name] && (
                        <p className="text-xs text-destructive mt-1">
                          Error: {proxyErrors[proxy.name]}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => testProxy(proxy)}
                      variant="ghost"
                      size="sm"
                      disabled={proxyStatuses[proxy.name] === 'testing'}
                    >
                      Test
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Custom Proxy URL (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  If you have your own CORS proxy server, enter its URL here. It will be tried first before public proxies.
                </p>
                <Input
                  placeholder="https://your-proxy-server.com/api"
                  value={customProxyUrl}
                  onChange={(e) => setCustomProxyUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Set VITE_PROXY_URL environment variable to configure this permanently.
                </p>
              </div>
            </>
          )}

          <div className="p-4 bg-accent/10 rounded-md border border-accent/20 space-y-2">
            <h4 className="font-semibold text-sm">Recommendations</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Direct API mode is faster and more reliable when it works</li>
              <li>If direct mode fails with CORS errors, disable it to use proxies</li>
              <li>Test proxies to find which ones work in your network environment</li>
              <li>For production use, consider deploying your own CORS proxy server</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
          <Button
            onClick={() => {
              localStorage.setItem('releye-direct-api-mode', String(useDirectMode))
              if (customProxyUrl) {
                localStorage.setItem('releye-custom-proxy-url', customProxyUrl)
              }
              toast.success('API configuration saved')
              onOpenChange(false)
            }}
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
