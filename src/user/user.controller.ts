import { Patch } from '@nestjs/common';
import { Body, Delete, Get, Param, Post } from '@nestjs/common';
import { Put } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { Observable , of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from './models/user.interface';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private userService: UserService) { }

    @Post()
    create(@Body() user:User): Observable<User | Object>{
        return this.userService.create(user).pipe(
            map((user: User) => user),
            catchError(err => of({ error: err.message }))
        );
        //return this.userService.create(user);
    }


    
    @Post('login')
    login(@Body() user: User): Observable<Object> {
        return this.userService.login(user).pipe(
            map((jwt: string) => {
                return { access_token: jwt };
            })
        )
    }



    @Get(':id')
    findOne(@Param()params:User): Observable<User>{
        return this.userService.findOne(params.id);
    }

    @Get()
    findAll(): Observable<User[]>{
        return this.userService.findAll();
    }

    @Delete(':id')
    deleteOne(@Param('id') id:string):Observable<any>{
        return this.userService.deleteOne(Number(id));
    }

    @Put(':id')
    updateOne(@Param('id')id:string, @Body() user: User): Observable<any>{
        return this.userService.updateOne(Number(id) , user);
    }
}
