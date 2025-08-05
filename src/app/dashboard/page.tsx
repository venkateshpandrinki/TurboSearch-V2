import { auth } from '@/utils/auth'
import { FC } from 'react'

interface pageProps {
  
}

const page: FC<pageProps> = async ({}) => {

    const session = await auth()
  return <div>{session?.user?.name}</div>
}

export default page